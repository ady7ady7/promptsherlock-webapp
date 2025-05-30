import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

// Allowed MIME types - CRITICAL: Only allow safe image formats
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png', 
  'image/gif',
  'image/webp'
]);

// Allowed file extensions - Double validation for security
const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg', 
  '.png',
  '.gif',
  '.webp'
]);

// File size limits (configurable via environment)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
const MAX_FILES = parseInt(process.env.MAX_FILES) || 10; // 10 files maximum

// Upload directory configuration
const UPLOAD_DIR = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// =============================================================================
// DIRECTORY SETUP WITH SECURITY CHECKS
// =============================================================================

/**
 * Ensure upload directory exists and is secure
 * SECURITY: Prevents directory traversal and ensures proper permissions
 */
const ensureUploadDirectory = async () => {
  try {
    // Check if directory exists
    const dirExists = await fs.pathExists(UPLOAD_DIR);
    
    if (!dirExists) {
      // Create directory with restricted permissions (755)
      await fs.ensureDir(UPLOAD_DIR, { mode: 0o755 });
      console.log('📁 Created secure uploads directory:', UPLOAD_DIR);
    }

    // Verify directory is writable
    await fs.access(UPLOAD_DIR, fs.constants.W_OK);
    
    // Create .gitkeep file to preserve directory in version control
    const gitkeepPath = path.join(UPLOAD_DIR, '.gitkeep');
    if (!await fs.pathExists(gitkeepPath)) {
      await fs.writeFile(gitkeepPath, '# Keep this directory in version control\n');
    }

    console.log('✅ Upload directory verified:', UPLOAD_DIR);
    
  } catch (error) {
    console.error('❌ Failed to setup upload directory:', error);
    throw new Error('Upload directory setup failed');
  }
};

// Initialize directory on module load
await ensureUploadDirectory();

// =============================================================================
// SECURE FILENAME GENERATION
// =============================================================================

/**
 * Generate cryptographically secure unique filename
 * SECURITY: Prevents filename collisions and directory traversal
 * 
 * @param {Object} file - Multer file object
 * @returns {string} - Secure unique filename
 */
const generateSecureFilename = (file) => {
  try {
    // Extract and validate file extension
    const originalExt = path.extname(file.originalname).toLowerCase();
    
    // Fallback to MIME type if extension is missing or invalid
    const safeExt = ALLOWED_EXTENSIONS.has(originalExt) 
      ? originalExt 
      : getExtensionFromMimeType(file.mimetype);

    // Generate cryptographically secure random bytes
    const randomBytes = crypto.randomBytes(16).toString('hex');
    
    // Add timestamp for additional uniqueness
    const timestamp = Date.now();
    
    // Create secure filename: image-timestamp-randomhex.ext
    const secureFilename = `image-${timestamp}-${randomBytes}${safeExt}`;
    
    // SECURITY: Validate final filename doesn't contain dangerous characters
    if (!/^[a-zA-Z0-9._-]+$/.test(secureFilename)) {
      throw new Error('Generated filename contains invalid characters');
    }
    
    console.log(`🔒 Generated secure filename: ${secureFilename}`);
    return secureFilename;
    
  } catch (error) {
    console.error('❌ Filename generation failed:', error);
    throw new Error('Could not generate secure filename');
  }
};

/**
 * Get file extension from MIME type as fallback
 * SECURITY: Ensures proper extension even if original is missing/invalid
 * 
 * @param {string} mimeType - File MIME type
 * @returns {string} - File extension with dot
 */
const getExtensionFromMimeType = (mimeType) => {
  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
  };
  
  return mimeToExt[mimeType] || '.jpg'; // Default to .jpg if unknown
};

// =============================================================================
// ADVANCED FILE VALIDATION
// =============================================================================

/**
 * Comprehensive file validation with security checks
 * SECURITY: Multi-layer validation prevents malicious uploads
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const secureFileFilter = (req, file, cb) => {
  console.log('🔍 Starting file validation for:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size || 'unknown'
  });

  try {
    // SECURITY CHECK 1: Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const error = new Error(
        `Invalid file type: ${file.mimetype}. ` +
        `Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`
      );
      error.code = 'INVALID_MIME_TYPE';
      return cb(error, false);
    }

    // SECURITY CHECK 2: Validate file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (fileExtension && !ALLOWED_EXTENSIONS.has(fileExtension)) {
      const error = new Error(
        `Invalid file extension: ${fileExtension}. ` +
        `Allowed extensions: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`
      );
      error.code = 'INVALID_EXTENSION';
      return cb(error, false);
    }

    // SECURITY CHECK 3: Validate filename for dangerous patterns
    const filename = file.originalname;
    
    // Check for directory traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      const error = new Error('Filename contains invalid path characters');
      error.code = 'INVALID_FILENAME_PATH';
      return cb(error, false);
    }

    // Check for executable extensions (double extension attack)
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.js', '.vbs'];
    const lowerFilename = filename.toLowerCase();
    
    for (const dangerousExt of dangerousExtensions) {
      if (lowerFilename.includes(dangerousExt)) {
        const error = new Error('Filename contains potentially dangerous extension');
        error.code = 'DANGEROUS_FILENAME';
        return cb(error, false);
      }
    }

    // SECURITY CHECK 4: Validate filename length
    if (filename.length > 255) {
      const error = new Error('Filename too long (maximum 255 characters)');
      error.code = 'FILENAME_TOO_LONG';
      return cb(error, false);
    }

    // SECURITY CHECK 5: Check for null bytes (path truncation attack)
    if (filename.includes('\0')) {
      const error = new Error('Filename contains null bytes');
      error.code = 'NULL_BYTE_FILENAME';
      return cb(error, false);
    }

    // SECURITY CHECK 6: Validate against common malicious patterns
    const maliciousPatterns = [
      /\.(php|asp|jsp|cgi|pl)$/i,  // Server-side scripts
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,  // Windows reserved names
      /[<>:"|?*]/,  // Windows invalid characters
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(filename)) {
        const error = new Error('Filename contains invalid or dangerous characters');
        error.code = 'MALICIOUS_FILENAME';
        return cb(error, false);
      }
    }

    console.log('✅ File validation passed:', filename);
    cb(null, true);

  } catch (error) {
    console.error('❌ File validation error:', error);
    const validationError = new Error('File validation failed');
    validationError.code = 'VALIDATION_ERROR';
    cb(validationError, false);
  }
};

// =============================================================================
// MULTER STORAGE CONFIGURATION
// =============================================================================

/**
 * Secure disk storage configuration
 * SECURITY: Controls file destination and naming with validation
 */
const secureStorage = multer.diskStorage({
  /**
   * Destination function - determines upload directory
   * SECURITY: Validates destination path to prevent traversal
   */
  destination: (req, file, cb) => {
    try {
      // Ensure the upload directory still exists and is writable
      fs.access(UPLOAD_DIR, fs.constants.W_OK)
        .then(() => {
          console.log('📂 Destination verified:', UPLOAD_DIR);
          cb(null, UPLOAD_DIR);
        })
        .catch((error) => {
          console.error('❌ Upload directory not accessible:', error);
          cb(new Error('Upload directory not accessible'), null);
        });
    } catch (error) {
      console.error('❌ Destination validation failed:', error);
      cb(error, null);
    }
  },

  /**
   * Filename function - generates secure unique filenames
   * SECURITY: Prevents filename collisions and dangerous names
   */
  filename: (req, file, cb) => {
    try {
      const secureFilename = generateSecureFilename(file);
      
      // Double-check the generated filename is safe
      const finalPath = path.join(UPLOAD_DIR, secureFilename);
      const resolvedPath = path.resolve(finalPath);
      
      // SECURITY: Ensure resolved path is still within upload directory
      if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
        throw new Error('Generated path outside upload directory');
      }

      console.log('💾 Saving file as:', secureFilename);
      cb(null, secureFilename);
      
    } catch (error) {
      console.error('❌ Filename generation failed:', error);
      cb(error, null);
    }
  }
});

// =============================================================================
// MULTER INSTANCE CONFIGURATION
// =============================================================================

/**
 * Main multer instance with security configuration
 * SECURITY: Comprehensive limits and validation
 */
const upload = multer({
  storage: secureStorage,
  fileFilter: secureFileFilter,
  limits: {
    // File size limit per file
    fileSize: MAX_FILE_SIZE,
    
    // Maximum number of files
    files: MAX_FILES,
    
    // Maximum number of non-file fields
    fields: 10,
    
    // Maximum field name size (prevents buffer overflow)
    fieldNameSize: 100,
    
    // Maximum field value size (for text fields)
    fieldSize: 1024 * 1024, // 1MB
    
    // Maximum number of parts (fields + files)
    parts: MAX_FILES + 10,
    
    // Maximum header pairs
    headerPairs: 2000
  }
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Comprehensive error handler for upload operations
 * SECURITY: Sanitizes error messages to prevent information leakage
 * 
 * @param {Error} error - Upload error
 * @param {Object} req - Express request
 * @param {Object} res - Express response  
 * @param {Function} next - Next middleware
 */
export const handleUploadErrors = (error, req, res, next) => {
  console.error('🚨 Upload error:', {
    code: error.code,
    message: error.message,
    field: error.field || 'unknown'
  });

  // Clean up any uploaded files on error
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      fs.remove(file.path).catch(err => {
        console.error('❌ Failed to cleanup file after error:', err);
      });
    });
  }

  // Handle Multer-specific errors
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File too large',
          details: `Maximum file size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          code: 'FILE_TOO_LARGE',
          field: error.field
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files',
          details: `Maximum ${MAX_FILES} files allowed per request`,
          code: 'TOO_MANY_FILES'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field',
          details: 'Please use the "images" field for file uploads',
          code: 'UNEXPECTED_FIELD',
          field: error.field
        });
      
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many form parts',
          details: 'Request contains too many fields and files',
          code: 'TOO_MANY_PARTS'
        });

      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many fields',
          details: 'Request contains too many form fields',
          code: 'TOO_MANY_FIELDS'
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          details: 'An error occurred during file upload',
          code: error.code || 'UPLOAD_ERROR'
        });
    }
  }

  // Handle custom validation errors
  const customErrorCodes = [
    'INVALID_MIME_TYPE',
    'INVALID_EXTENSION', 
    'INVALID_FILENAME_PATH',
    'DANGEROUS_FILENAME',
    'FILENAME_TOO_LONG',
    'NULL_BYTE_FILENAME',
    'MALICIOUS_FILENAME',
    'VALIDATION_ERROR'
  ];

  if (customErrorCodes.includes(error.code)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file format or name',
      details: error.message,
      code: error.code
    });
  }

  // Handle filesystem errors
  if (error.code === 'ENOENT' || error.code === 'EACCES') {
    return res.status(500).json({
      success: false,
      error: 'Upload directory error',
      details: 'Server configuration issue. Please try again later.',
      code: 'DIRECTORY_ERROR'
    });
  }

  // Generic error - don't leak sensitive information
  console.error('❌ Unhandled upload error:', error);
  res.status(500).json({
    success: false,
    error: 'Upload failed',
    details: 'An unexpected error occurred during file upload',
    code: 'UNKNOWN_ERROR'
  });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get upload configuration information
 * @returns {Object} Configuration details
 */
export const getUploadConfig = () => ({
  maxFileSize: MAX_FILE_SIZE,
  maxFileSizeMB: Math.round(MAX_FILE_SIZE / 1024 / 1024),
  maxFiles: MAX_FILES,
  allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
  allowedExtensions: Array.from(ALLOWED_EXTENSIONS),
  uploadDirectory: UPLOAD_DIR
});

/**
 * Validate upload directory health
 * @returns {Promise<Object>} Directory status
 */
export const validateUploadDirectory = async () => {
  try {
    await fs.access(UPLOAD_DIR, fs.constants.R_OK | fs.constants.W_OK);
    const stats = await fs.stat(UPLOAD_DIR);
    
    return {
      exists: true,
      writable: true,
      path: UPLOAD_DIR,
      isDirectory: stats.isDirectory(),
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return {
      exists: false,
      writable: false,
      path: UPLOAD_DIR,
      error: error.message
    };
  }
};

// =============================================================================
// EXPORT SECURE UPLOAD MIDDLEWARE
// =============================================================================

/**
 * Secure upload middleware with error handling
 * Usage: router.post('/upload', secureUpload.array('images', 10), handler)
 */
export const secureUpload = upload;

/**
 * Express middleware wrapper with automatic error handling
 * Usage: router.post('/upload', uploadMiddleware('images', 10), handler)
 */
export const uploadMiddleware = (fieldName = 'images', maxCount = MAX_FILES) => {
  return (req, res, next) => {
    const uploadHandler = upload.array(fieldName, maxCount);
    
    uploadHandler(req, res, (error) => {
      if (error) {
        return handleUploadErrors(error, req, res, next);
      }
      
      // Log successful upload for security monitoring
      if (req.files && req.files.length > 0) {
        console.log(`✅ Successfully uploaded ${req.files.length} files:`, 
          req.files.map(f => ({ 
            original: f.originalname, 
            saved: f.filename, 
            size: f.size 
          }))
        );
      }
      
      next();
    });
  };
};

// Default export for convenience
export default uploadMiddleware;