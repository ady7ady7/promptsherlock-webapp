import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure storage
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
    mimetype: file.mimetype,
    size: file.size
  });

  // Allowed MIME types
  const allowedTypes = (process.env.ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
  
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

  // Check for potentially malicious filenames
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
  if (sanitizedName !== file.originalname) {
    console.warn('⚠️ Potentially unsafe filename detected:', file.originalname);
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

// Error handling middleware for multer
export const handleUploadErrors = (error, req, res, next) => {
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
      
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many form fields',
          details: 'Request contains too many parts',
          code: 'TOO_MANY_PARTS'
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

// Add error handling to upload middleware
const uploadWithErrorHandling = (req, res, next) => {
  const uploadMiddleware = upload.array('images', parseInt(process.env.MAX_FILES) || 10);
  
  uploadMiddleware(req, res, (error) => {
    if (error) {
      return handleUploadErrors(error, req, res, next);
    }
    next();
  });
};

export default uploadWithErrorHandling;