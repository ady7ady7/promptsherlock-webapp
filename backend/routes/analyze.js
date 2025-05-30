import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import { cleanupFiles } from '../utils/cleanup.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
try {
  await fs.access(uploadsDir);
} catch {
  await fs.mkdir(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure multer storage directly in this file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

// File filter for image validation
const fileFilter = (req, file, cb) => {
  console.log('🔍 Validating file:', {
    originalname: file.originalname,
    mimetype: file.mimetype
  });

  // Allowed MIME types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  // Additional extension validation for security
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    const error = new Error(`Invalid file extension: ${fileExtension}. Allowed extensions: ${allowedExtensions.join(', ')}`);
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }

  console.log('✅ File validation passed:', file.originalname);
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: parseInt(process.env.MAX_FILES) || 10, // 10 files maximum
    fields: 10, // Maximum number of non-file fields
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024, // 1MB max field size
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get Gemini model
const model = genAI.getGenerativeModel({ 
  model: process.env.AI_MODEL || 'gemini-1.5-flash',
  generationConfig: {
    maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS) || 8192,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1,
  }
});

/**
 * Convert file to Gemini-compatible format
 */
async function fileToGenerativePart(filePath, mimeType) {
  try {
    const data = await fs.readFile(filePath);
    return {
      inlineData: {
        data: data.toString('base64'),
        mimeType: mimeType
      }
    };
  } catch (error) {
    console.error('❌ Error reading file:', error);
    throw new Error('Failed to process image file');
  }
}

/**
 * Generate comprehensive image analysis prompt
 */
function generateAnalysisPrompt(imageCount, customPrompt = '') {
  const basePrompt = `You are an expert image analyst. Please provide a comprehensive analysis of the ${imageCount === 1 ? 'image' : `${imageCount} images`} provided.

Your analysis should include:

1. **Visual Description**: Describe what you see in detail
2. **Objects & Elements**: Identify all significant objects, people, animals, or elements
3. **Composition & Style**: Analyze the composition, colors, lighting, and artistic style
4. **Context & Setting**: Describe the environment, location, or context
5. **Technical Aspects**: Comment on image quality, resolution, and photographic technique if applicable
6. **Emotional Tone**: Describe the mood or emotional impact of the image(s)
7. **Notable Features**: Point out any unique, interesting, or unusual aspects

${customPrompt ? `\n**Special Focus**: ${customPrompt}\n` : ''}

Please be thorough, specific, and provide insights that would be valuable for understanding the image(s) comprehensively. Format your response in clear sections for easy reading.`;

  return basePrompt;
}

/**
 * Handle multer errors
 */
const handleUploadErrors = (error, req, res, next) => {
  console.error('🚨 Upload error:', error);

  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File too large',
          details: `Maximum file size is ${Math.round((parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1024 / 1024)}MB`,
          code: 'FILE_TOO_LARGE'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files',
          details: `Maximum ${parseInt(process.env.MAX_FILES) || 10} files allowed`,
          code: 'TOO_MANY_FILES'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field',
          details: 'Please use the "images" field for file uploads',
          code: 'UNEXPECTED_FIELD'
        });
      
      default:
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          details: error.message,
          code: error.code
        });
    }
  }

  // Handle custom validation errors
  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_FILE_EXTENSION') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file format',
      details: error.message,
      code: error.code
    });
  }

  // Pass other errors to the global error handler
  next(error);
};

/**
 * POST /api/analyze
 * Analyze uploaded images using Gemini AI
 */
router.post('/', (req, res, next) => {
  // Use multer middleware with error handling
  upload.array('images', 10)(req, res, (error) => {
    if (error) {
      return handleUploadErrors(error, req, res, next);
    }
    
    // Continue to the actual route handler
    handleAnalyzeRequest(req, res);
  });
});

/**
 * Main analysis request handler
 */
async function handleAnalyzeRequest(req, res) {
  const uploadedFiles = req.files || [];
  const customPrompt = req.body.prompt || '';
  
  console.log(`📸 Received ${uploadedFiles.length} files for analysis`);
  
  try {
    // Validate file upload
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided. Please upload at least one image.',
        details: 'The request must include image files in the "images" field.'
      });
    }

    if (uploadedFiles.length > 10) {
      await cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        error: 'Too many images. Maximum 10 images allowed per request.',
        details: `You uploaded ${uploadedFiles.length} images. Please reduce to 10 or fewer.`
      });
    }

    // Log file details for debugging
    console.log('📋 Files received:', uploadedFiles.map(file => ({
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    })));

    // Prepare images for Gemini API
    const imageParts = [];
    const processedFiles = [];

    for (const file of uploadedFiles) {
      try {
        const imagePart = await fileToGenerativePart(file.path, file.mimetype);
        imageParts.push(imagePart);
        processedFiles.push({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
        console.log(`✅ Processed image: ${file.originalname}`);
      } catch (error) {
        console.error(`❌ Failed to process ${file.originalname}:`, error.message);
        await cleanupFiles(uploadedFiles);
        return res.status(500).json({
          success: false,
          error: `Failed to process image: ${file.originalname}`,
          details: 'The image file may be corrupted or in an unsupported format.'
        });
      }
    }

    // Generate analysis prompt
    const prompt = generateAnalysisPrompt(imageParts.length, customPrompt);
    
    // Prepare content for Gemini
    const content = [prompt, ...imageParts];

    console.log('🤖 Sending request to Gemini AI...');
    const startTime = Date.now();

    // Call Gemini API
    const result = await model.generateContent(content);
    const response = await result.response;
    const analysis = response.text();

    const processingTime = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${processingTime}ms`);

    // Cleanup uploaded files immediately after processing
    await cleanupFiles(uploadedFiles);
    console.log('🗑️ Temporary files cleaned up');

    // Validate response
    if (!analysis || analysis.trim().length === 0) {
      return res.status(500).json({
        success: false,
        error: 'AI analysis failed to generate results',
        details: 'The AI service returned an empty response. Please try again.'
      });
    }

    // Return successful response
    res.json({
      success: true,
      analysis: analysis.trim(),
      metadata: {
        processedImages: processedFiles.length,
        processingTimeMs: processingTime,
        model: process.env.AI_MODEL || 'gemini-1.5-flash',
        customPrompt: customPrompt || null,
        files: processedFiles,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('🚨 Analysis error:', error);

    // Always cleanup files on error
    if (uploadedFiles.length > 0) {
      await cleanupFiles(uploadedFiles);
      console.log('🗑️ Cleaned up files after error');
    }

    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(401).json({
        success: false,
        error: 'AI service authentication failed',
        details: 'Please check your API configuration and try again.'
      });
    }

    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return res.status(429).json({
        success: false,
        error: 'AI service rate limit exceeded',
        details: 'Please wait a moment and try again. The service is temporarily busy.'
      });
    }

    if (error.message?.includes('content') || error.message?.includes('safety')) {
      return res.status(400).json({
        success: false,
        error: 'Content not suitable for analysis',
        details: 'The uploaded images may contain content that cannot be analyzed.'
      });
    }

    // Generic error response
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
      success: false,
      error: 'Image analysis failed',
      details: isDevelopment ? error.message : 'An unexpected error occurred. Please try again.',
      ...(isDevelopment && { stack: error.stack })
    });
  }
}

/**
 * GET /api/analyze/health
 * Health check for analyze service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Image Analysis',
    aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
    maxFiles: parseInt(process.env.MAX_FILES) || 10,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    timestamp: new Date().toISOString()
  });
});

export default router;