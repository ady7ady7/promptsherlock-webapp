import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadMiddleware } from '../middleware/upload.js';
import { cleanupFiles } from '../utils/cleanup.js';
import fs from 'fs/promises';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get Gemini model with enhanced configuration
const model = genAI.getGenerativeModel({ 
  model: process.env.AI_MODEL || 'gemini-1.5-flash',
  generationConfig: {
    maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS) || 8192,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1,
    topP: 0.8,
    topK: 40,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert file to Gemini-compatible format
 * SECURITY: Validates file exists and is readable before processing
 * 
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} Gemini-compatible file object
 */
async function fileToGenerativePart(filePath, mimeType) {
  try {
    // Security check: Verify file exists and is readable
    await fs.access(filePath, fs.constants.R_OK);
    
    // Read file data
    const data = await fs.readFile(filePath);
    
    // Validate file size (additional check beyond multer)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
    if (data.length > maxSize) {
      throw new Error(`File too large: ${data.length} bytes`);
    }
    
    // Convert to base64 for Gemini API
    const base64Data = data.toString('base64');
    
    console.log(`📄 Converted file to base64 (${base64Data.length} chars)`);
    
    return {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };
  } catch (error) {
    console.error('❌ Error converting file:', error);
    throw new Error(`Failed to process image file: ${error.message}`);
  }
}

/**
 * Generate comprehensive and dynamic analysis prompt
 * 
 * @param {number} imageCount - Number of images to analyze
 * @param {string} customPrompt - User's custom analysis request
 * @returns {string} Formatted analysis prompt
 */
function generateAnalysisPrompt(imageCount, customPrompt = '') {
  const basePrompt = `You are an expert AI image analyst with advanced computer vision capabilities. Please provide a comprehensive and detailed analysis of the ${imageCount === 1 ? 'image' : `${imageCount} images`} I'm sharing with you.

## Analysis Framework:

### 🔍 **Visual Description**
- Describe what you see in vivid detail
- Note the primary subjects, objects, and scenes
- Identify any people, animals, or notable elements

### 🎨 **Composition & Aesthetics**
- Analyze the visual composition, framing, and layout
- Describe colors, lighting, shadows, and contrast
- Comment on artistic style, mood, and atmosphere
- Evaluate visual balance and focal points

### 🏞️ **Context & Environment**
- Describe the setting, location, or environment
- Note time of day, weather, or seasonal indicators
- Identify architectural or geographical features

### 🔧 **Technical Analysis**
- Comment on image quality, resolution, and clarity
- Note photographic techniques (depth of field, perspective, etc.)
- Identify any potential camera settings or equipment used

### 📝 **Text & Readable Content**
- Transcribe any visible text, signs, or writing
- Note logos, brands, or identifying marks
- Describe any documents or readable materials

### 💭 **Interpretation & Insights**
- Provide context about what might be happening
- Note any symbolic, cultural, or historical significance
- Suggest the purpose or story behind the image(s)

### ⭐ **Notable Features**
- Highlight unique, interesting, or unusual aspects
- Point out any anomalies or unexpected elements
- Note anything that stands out or requires attention

${imageCount > 1 ? `

### 🔗 **Multi-Image Analysis** (for ${imageCount} images)
- Compare and contrast the different images
- Identify relationships, patterns, or sequences
- Note any progression, variation, or common themes
- Analyze the collection as a cohesive set

` : ''}

${customPrompt ? `

### 🎯 **Special Focus Area**
Based on your specific request: "${customPrompt}"

Please pay particular attention to this aspect while maintaining the comprehensive analysis above.

` : ''}

## Instructions:
- Be extremely detailed and specific in your observations
- Use clear, organized sections for easy reading
- Provide insights that would be valuable for understanding the content
- If you're uncertain about something, mention your confidence level
- Focus on factual observations while providing thoughtful interpretation

Please analyze thoroughly and provide rich, detailed insights about the image(s).`;

  return basePrompt;
}

/**
 * Validate and sanitize analysis results
 * 
 * @param {string} analysis - Raw AI analysis text
 * @returns {string} Validated and formatted analysis
 */
function validateAnalysisResult(analysis) {
  if (!analysis || typeof analysis !== 'string') {
    throw new Error('Invalid analysis result format');
  }

  const trimmed = analysis.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Analysis result is empty');
  }

  if (trimmed.length < 50) {
    throw new Error('Analysis result too short - may indicate an error');
  }

  // Check for common error patterns
  const errorPatterns = [
    /I cannot|I am unable|I can't/i,
    /error|failed|invalid/i,
    /safety|blocked|restricted/i
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(trimmed.substring(0, 200))) {
      console.warn('⚠️ Potential error in analysis result');
      break;
    }
  }

  return trimmed;
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * POST /api/analyze
 * Analyze uploaded images using Gemini AI
 * 
 * Security: Uses secure upload middleware with comprehensive validation
 * Rate limiting: Applied at server level
 * File cleanup: Automatic cleanup after processing
 */
router.post('/', uploadMiddleware('images', 10), async (req, res) => {
  const uploadedFiles = req.files || [];
  const customPrompt = req.body.prompt || '';
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.log(`📸 [${requestId}] Analysis request: ${uploadedFiles.length} files`);
  
  try {
    // Validate request
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided',
        details: 'Please upload at least one image file using the "images" field.',
        code: 'NO_FILES_UPLOADED'
      });
    }

    // Additional security validation
    if (uploadedFiles.length > 10) {
      console.warn(`⚠️ [${requestId}] Too many files: ${uploadedFiles.length}`);
      await cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        error: 'Too many images',
        details: `Maximum 10 images allowed. You uploaded ${uploadedFiles.length} images.`,
        code: 'TOO_MANY_FILES'
      });
    }

    // Log file details for security monitoring
    const fileDetails = uploadedFiles.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    }));
    
    console.log(`📋 [${requestId}] Files:`, fileDetails);

    // Validate custom prompt length and content
    if (customPrompt && customPrompt.length > 1000) {
      await cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        error: 'Custom prompt too long',
        details: 'Maximum 1000 characters allowed for custom prompts.',
        code: 'PROMPT_TOO_LONG'
      });
    }

    // Process files for AI analysis
    const imageParts = [];
    const processedFiles = [];
    const processingStartTime = Date.now();

    console.log(`🔄 [${requestId}] Processing ${uploadedFiles.length} files for AI analysis...`);

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      try {
        console.log(`📄 [${requestId}] Processing file ${i + 1}/${uploadedFiles.length}: ${file.originalname}`);
        
        const imagePart = await fileToGenerativePart(file.path, file.mimetype);
        imageParts.push(imagePart);
        
        processedFiles.push({
          index: i + 1,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          processed: true
        });
        
        console.log(`✅ [${requestId}] File ${i + 1} processed successfully`);
        
      } catch (error) {
        console.error(`❌ [${requestId}] Failed to process file ${i + 1} (${file.originalname}):`, error.message);
        
        // Cleanup all files and return error
        await cleanupFiles(uploadedFiles);
        
        return res.status(500).json({
          success: false,
          error: `Failed to process image: ${file.originalname}`,
          details: 'The image file may be corrupted, too large, or in an unsupported format.',
          code: 'FILE_PROCESSING_ERROR',
          fileIndex: i + 1
        });
      }
    }

    const processingTime = Date.now() - processingStartTime;
    console.log(`⚡ [${requestId}] File processing completed in ${processingTime}ms`);

    // Generate AI analysis prompt
    const analysisPrompt = generateAnalysisPrompt(imageParts.length, customPrompt);
    
    // Prepare content for Gemini API
    const content = [analysisPrompt, ...imageParts];

    console.log(`🤖 [${requestId}] Sending request to Gemini AI (${process.env.AI_MODEL || 'gemini-1.5-flash'})...`);
    const aiStartTime = Date.now();

    // Call Gemini API with error handling
    let result, response, analysis;
    
    try {
      result = await model.generateContent(content);
      response = await result.response;
      analysis = response.text();
      
      // Validate the response
      if (!analysis) {
        throw new Error('Empty response from AI service');
      }
      
    } catch (apiError) {
      console.error(`❌ [${requestId}] Gemini API error:`, apiError);
      
      // Cleanup files before returning error
      await cleanupFiles(uploadedFiles);
      
      // Handle specific API errors
      if (apiError.message?.includes('API key')) {
        return res.status(401).json({
          success: false,
          error: 'AI service authentication failed',
          details: 'Invalid or missing API key. Please check server configuration.',
          code: 'AUTH_ERROR'
        });
      }
      
      if (apiError.message?.includes('quota') || apiError.message?.includes('limit')) {
        return res.status(429).json({
          success: false,
          error: 'AI service rate limit exceeded',
          details: 'The AI service is temporarily unavailable due to rate limiting. Please try again later.',
          code: 'RATE_LIMIT_ERROR'
        });
      }
      
      if (apiError.message?.includes('safety') || apiError.message?.includes('blocked')) {
        return res.status(400).json({
          success: false,
          error: 'Content blocked by safety filters',
          details: 'The uploaded images contain content that cannot be analyzed due to safety restrictions.',
          code: 'CONTENT_BLOCKED'
        });
      }
      
      if (apiError.message?.includes('file size') || apiError.message?.includes('too large')) {
        return res.status(400).json({
          success: false,
          error: 'Images too large for AI processing',
          details: 'One or more images exceed the AI service size limits. Please try smaller images.',
          code: 'FILE_SIZE_ERROR'
        });
      }
      
      // Generic API error
      return res.status(500).json({
        success: false,
        error: 'AI analysis failed',
        details: 'The AI service encountered an error while processing your images. Please try again.',
        code: 'AI_SERVICE_ERROR'
      });
    }

    const aiProcessingTime = Date.now() - aiStartTime;
    console.log(`🧠 [${requestId}] AI analysis completed in ${aiProcessingTime}ms`);

    // Validate and sanitize the analysis result
    try {
      analysis = validateAnalysisResult(analysis);
    } catch (validationError) {
      console.error(`❌ [${requestId}] Analysis validation failed:`, validationError.message);
      
      await cleanupFiles(uploadedFiles);
      
      return res.status(500).json({
        success: false,
        error: 'Invalid analysis result',
        details: 'The AI service returned an invalid response. Please try again.',
        code: 'INVALID_ANALYSIS'
      });
    }

    // Cleanup uploaded files immediately after successful processing
    const cleanupStartTime = Date.now();
    await cleanupFiles(uploadedFiles);
    const cleanupTime = Date.now() - cleanupStartTime;
    
    console.log(`🗑️ [${requestId}] Files cleaned up in ${cleanupTime}ms`);

    // Calculate total processing time
    const totalProcessingTime = Date.now() - processingStartTime;

    // Prepare success response
    const responseData = {
      success: true,
      analysis: analysis,
      metadata: {
        requestId: requestId,
        processedImages: processedFiles.length,
        totalProcessingTimeMs: totalProcessingTime,
        breakdown: {
          fileProcessingMs: processingTime,
          aiAnalysisMs: aiProcessingTime,
          cleanupMs: cleanupTime
        },
        aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
        customPrompt: customPrompt || null,
        files: processedFiles,
        timestamp: new Date().toISOString(),
        security: {
          filesValidated: true,
          immediateCleanup: true,
          secureProcessing: true
        }
      }
    };

    console.log(`✅ [${requestId}] Analysis completed successfully - ${analysis.length} characters, ${totalProcessingTime}ms total`);

    // Return successful response
    res.json(responseData);

  } catch (error) {
    console.error(`🚨 [${requestId}] Unexpected error:`, error);

    // Emergency cleanup of files
    if (uploadedFiles && uploadedFiles.length > 0) {
      try {
        await cleanupFiles(uploadedFiles);
        console.log(`🗑️ [${requestId}] Emergency cleanup completed`);
      } catch (cleanupError) {
        console.error(`❌ [${requestId}] Emergency cleanup failed:`, cleanupError);
      }
    }

    // Return generic error response (don't leak sensitive information)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: isDevelopment 
        ? `Server error: ${error.message}` 
        : 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
      requestId: requestId,
      ...(isDevelopment && { stack: error.stack })
    });
  }
});

/**
 * GET /api/analyze/health
 * Health check for the analysis service
 * Returns configuration and status information
 */
router.get('/health', async (req, res) => {
  try {
    const { getUploadConfig, validateUploadDirectory } = await import('../middleware/upload.js');
    
    // Get upload configuration
    const uploadConfig = getUploadConfig();
    
    // Validate upload directory
    const directoryStatus = await validateUploadDirectory();
    
    // Test Gemini AI connectivity (optional quick test)
    let aiStatus = 'unknown';
    try {
      // Quick test with minimal content
      const testModel = genAI.getGenerativeModel({ model: process.env.AI_MODEL || 'gemini-1.5-flash' });
      const testResult = await testModel.generateContent('Test connection - respond with "OK"');
      const testResponse = await testResult.response;
      aiStatus = testResponse.text().includes('OK') ? 'connected' : 'limited';
    } catch (aiError) {
      aiStatus = 'error';
      console.warn('⚠️ AI health check failed:', aiError.message);
    }

    res.json({
      status: 'OK',
      service: 'Image Analysis API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      
      aiService: {
        provider: 'Google Gemini',
        model: process.env.AI_MODEL || 'gemini-1.5-flash',
        status: aiStatus,
        maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 8192,
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1
      },
      
      uploadConfig: {
        maxFileSize: uploadConfig.maxFileSizeMB + 'MB',
        maxFiles: uploadConfig.maxFiles,
        allowedTypes: uploadConfig.allowedMimeTypes,
        allowedExtensions: uploadConfig.allowedExtensions
      },
      
      storage: {
        directory: directoryStatus.path,
        exists: directoryStatus.exists,
        writable: directoryStatus.writable,
        ...(directoryStatus.error && { error: directoryStatus.error })
      },
      
      security: {
        fileValidation: 'enabled',
        secureFilenames: 'enabled',
        immediateCleanup: 'enabled',
        rateLimiting: 'enabled',
        corsProtection: 'enabled'
      },
      
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    
    res.status(500).json({
      status: 'ERROR',
      service: 'Image Analysis API',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable'
    });
  }
});

/**
 * GET /api/analyze/config
 * Get current upload and analysis configuration
 * Useful for frontend to know current limits
 */
router.get('/config', async (req, res) => {
  try {
    const { getUploadConfig } = await import('../middleware/upload.js');
    const config = getUploadConfig();
    
    res.json({
      success: true,
      config: {
        upload: {
          maxFileSize: config.maxFileSize,
          maxFileSizeMB: config.maxFileSizeMB,
          maxFiles: config.maxFiles,
          allowedTypes: config.allowedMimeTypes,
          allowedExtensions: config.allowedExtensions
        },
        analysis: {
          aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
          maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 8192,
          temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1,
          maxPromptLength: 1000
        },
        features: {
          customPrompts: true,
          multipleImages: true,
          detailedAnalysis: true,
          secureProcessing: true
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Config endpoint error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      details: 'Unable to retrieve current configuration'
    });
  }
});

export default router;