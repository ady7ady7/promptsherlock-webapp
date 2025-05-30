import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Sophisticated Image Uploader Component with drag-and-drop functionality
 * 
 * Features:
 * - Drag and drop with visual feedback
 * - Image preview grid with responsive layout
 * - Individual image removal
 * - File validation (type and size)
 * - Framer Motion animations
 * - Glass morphism design
 * - Upload progress indication
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onImagesChange - Callback when images change
 * @param {Array} props.initialImages - Initial images to display
 * @param {number} props.maxFiles - Maximum number of files (default: 10)
 * @param {number} props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param {boolean} props.disabled - Whether the uploader is disabled
 * @param {boolean} props.loading - Whether upload is in progress
 * @param {string} props.className - Additional CSS classes
 */
const ImageUploader = ({
  onImagesChange,
  initialImages = [],
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  loading = false,
  className = '',
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [images, setImages] = useState(initialImages);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);

  // =============================================================================
  // FILE VALIDATION CONFIGURATION
  // =============================================================================
  
  const acceptedFileTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
  };

  const maxFileSizeMB = Math.round(maxFileSize / 1024 / 1024);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  /**
   * Validates a single file
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  const validateFile = useCallback((file) => {
    const errors = [];
    
    // Check file type
    if (!Object.keys(acceptedFileTypes).includes(file.type)) {
      errors.push(`${file.name}: Invalid file type. Only images are allowed.`);
    }
    
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`${file.name}: File too large. Maximum size is ${maxFileSizeMB}MB.`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [maxFileSize, maxFileSizeMB]);

  /**
   * Creates preview object for an image file
   * @param {File} file - Image file
   * @returns {Object} Image preview object
   */
  const createImagePreview = useCallback((file) => {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      uploadProgress: 0,
      uploaded: false
    };
  }, []);

  /**
   * Handles image removal
   * @param {string} imageId - ID of image to remove
   */
  const handleRemoveImage = useCallback((imageId) => {
    setImages(prevImages => {
      const updatedImages = prevImages.filter(img => img.id !== imageId);
      
      // Clean up preview URL to prevent memory leaks
      const imageToRemove = prevImages.find(img => img.id === imageId);
      if (imageToRemove && imageToRemove.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      
      // Notify parent component
      onImagesChange?.(updatedImages);
      
      return updatedImages;
    });
    
    // Clear errors if any
    setErrors([]);
  }, [onImagesChange]);

  /**
   * Handles new file drops/selections
   * @param {File[]} acceptedFiles - Array of accepted files
   * @param {File[]} rejectedFiles - Array of rejected files
   */
  const handleFileDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const newErrors = [];
    
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors: fileErrors }) => {
      fileErrors.forEach(error => {
        switch (error.code) {
          case 'file-too-large':
            newErrors.push(`${file.name}: File too large (max ${maxFileSizeMB}MB)`);
            break;
          case 'file-invalid-type':
            newErrors.push(`${file.name}: Invalid file type (images only)`);
            break;
          case 'too-many-files':
            newErrors.push(`Too many files. Maximum ${maxFiles} files allowed.`);
            break;
          default:
            newErrors.push(`${file.name}: ${error.message}`);
        }
      });
    });

    // Validate accepted files
    const validatedFiles = [];
    acceptedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validatedFiles.push(file);
      } else {
        newErrors.push(...validation.errors);
      }
    });

    // Check if adding files would exceed the limit
    const totalFiles = images.length + validatedFiles.length;
    if (totalFiles > maxFiles) {
      const allowedCount = maxFiles - images.length;
      newErrors.push(`Can only add ${allowedCount} more file(s). Total limit: ${maxFiles}`);
      validatedFiles.splice(allowedCount);
    }

    // Set errors
    setErrors(newErrors);

    // Add valid files to images
    if (validatedFiles.length > 0) {
      const newImages = validatedFiles.map(createImagePreview);
      
      setImages(prevImages => {
        const updatedImages = [...prevImages, ...newImages];
        onImagesChange?.(updatedImages);
        return updatedImages;
      });

      // Simulate upload progress (for demo purposes)
      if (loading) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            setUploadProgress(0);
          }
        }, 200);
      }
    }
  }, [images.length, maxFiles, maxFileSizeMB, validateFile, createImagePreview, onImagesChange, loading]);

  // =============================================================================
  // DROPZONE CONFIGURATION
  // =============================================================================
  
  const {
    getRootProps,
    getInputProps,
    isDragAccept,
    isDragReject,
    open
  } = useDropzone({
    onDrop: handleFileDrop,
    accept: acceptedFileTypes,
    maxFiles: maxFiles - images.length,
    maxSize: maxFileSize,
    disabled: disabled || loading || images.length >= maxFiles,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
    noClick: false,
    noKeyboard: false
  });

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const remainingSlots = maxFiles - images.length;
  const isMaxReached = images.length >= maxFiles;
  const hasImages = images.length > 0;
  const hasErrors = errors.length > 0;

  // Determine dropzone state classes
  const dropzoneClasses = useMemo(() => {
    const baseClasses = 'dropzone transition-all duration-300';
    
    if (disabled || loading) {
      return `${baseClasses} opacity-50 cursor-not-allowed`;
    }
    
    if (isDragActive) {
      if (isDragAccept) {
        return `${baseClasses} dropzone-accept scale-[1.02]`;
      }
      if (isDragReject) {
        return `${baseClasses} dropzone-reject scale-[0.98]`;
      }
      return `${baseClasses} dropzone-active scale-[1.01]`;
    }
    
    if (isMaxReached) {
      return `${baseClasses} opacity-60 cursor-not-allowed`;
    }
    
    return `${baseClasses} hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer`;
  }, [disabled, loading, isDragActive, isDragAccept, isDragReject, isMaxReached]);

  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.3,
        ease: 'easeIn'
      }
    }
  };

  const imageVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
        ease: 'easeIn'
      }
    }
  };

  const removeButtonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  /**
   * Renders the upload dropzone area
   */
  const renderDropzone = () => (
    <motion.div
      {...getRootProps()}
      className={`${dropzoneClasses} ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={!disabled && !loading && !isMaxReached ? { scale: 1.01 } : {}}
      whileTap={!disabled && !loading && !isMaxReached ? { scale: 0.99 } : {}}
    >
      <input {...getInputProps()} />
      
      <div className="text-center p-8">
        {/* Upload Icon */}
        <motion.div
          className="mx-auto mb-6"
          animate={isDragActive ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {loading ? (
            <div className="spinner-glow w-16 h-16 mx-auto"></div>
          ) : isDragActive ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: 'backOut' }}
            >
              <CheckCircle className="w-16 h-16 text-green-400" />
            </motion.div>
          ) : (
            <Upload className={`w-16 h-16 mx-auto transition-colors duration-300 ${
              isMaxReached ? 'text-gray-500' : 'text-blue-400'
            }`} />
          )}
        </motion.div>

        {/* Upload Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
            isMaxReached ? 'text-gray-400' : 'gradient-text'
          }`}>
            {loading ? 'Uploading Images...' :
             isDragActive ? 'Drop Images Here' :
             isMaxReached ? 'Maximum Files Reached' :
             hasImages ? 'Add More Images' : 'Upload Your Images'}
          </h3>
          
          <p className={`text-lg mb-4 transition-colors duration-300 ${
            isMaxReached ? 'text-gray-500' : 'text-gray-300'
          }`}>
            {loading ? `Progress: ${uploadProgress}%` :
             isMaxReached ? `${maxFiles} files maximum` :
             isDragActive ? 'Release to upload' :
             'Drag and drop images here, or click to browse'}
          </p>

          {!isMaxReached && (
            <motion.div
              className="text-sm text-gray-400 space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <p>Up to {remainingSlots} more file{remainingSlots !== 1 ? 's' : ''}</p>
              <p>JPEG, PNG, GIF, WebP • Max {maxFileSizeMB}MB each</p>
            </motion.div>
          )}
        </motion.div>

        {/* Upload Progress Bar */}
        {loading && uploadProgress > 0 && (
          <motion.div
            className="mt-6 w-full bg-white/20 rounded-full h-2 overflow-hidden"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  /**
   * Renders individual image preview
   */
  const renderImagePreview = (image, index) => (
    <motion.div
      key={image.id}
      className="relative group"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      layoutId={image.id}
      custom={index}
    >
      <motion.div
        className="relative overflow-hidden rounded-xl glass-effect p-2"
        variants={imageVariants}
        whileHover="hover"
        whileTap="tap"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <img
            src={image.preview}
            alt={image.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          >
            <div className="text-center text-white p-2">
              <FileImage className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs font-medium truncate">{image.name}</p>
              <p className="text-xs text-gray-300">
                {(image.size / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
          </motion.div>
        </div>

        {/* Remove Button */}
        <AnimatePresence>
          <motion.button
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            variants={removeButtonVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage(image.id);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Remove ${image.name}`}
          >
            <X className="w-3 h-3" />
          </motion.button>
        </AnimatePresence>

        {/* Upload Progress (if applicable) */}
        {image.uploadProgress > 0 && image.uploadProgress < 100 && (
          <motion.div
            className="absolute bottom-2 left-2 right-2 bg-white/20 rounded-full h-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${image.uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  /**
   * Renders error messages
   */
  const renderErrors = () => (
    hasErrors && (
      <motion.div
        className="glass-effect border-red-400/50 bg-red-500/10 p-4 rounded-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-red-400 font-medium mb-2">Upload Errors:</h4>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <motion.li
                  key={index}
                  className="text-sm text-red-300"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  • {error}
                </motion.li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setErrors([])}
            className="text-red-400 hover:text-red-300 transition-colors"
            aria-label="Dismiss errors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <div className="space-y-6">
      {/* Dropzone */}
      {renderDropzone()}

      {/* Error Messages */}
      <AnimatePresence>
        {renderErrors()}
      </AnimatePresence>

      {/* Image Preview Grid */}
      <AnimatePresence>
        {hasImages && (
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Grid Header */}
            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-xl font-semibold text-white">
                Selected Images ({images.length}/{maxFiles})
              </h3>
              {images.length > 0 && (
                <motion.button
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  onClick={() => {
                    // Clean up all preview URLs
                    images.forEach(img => {
                      if (img.preview) URL.revokeObjectURL(img.preview);
                    });
                    setImages([]);
                    setErrors([]);
                    onImagesChange?.([]);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear All
                </motion.button>
              )}
            </motion.div>

            {/* Responsive Grid */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              layout
            >
              <AnimatePresence mode="popLayout">
                {images.map((image, index) => renderImagePreview(image, index))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// PROP TYPES VALIDATION
// =============================================================================

ImageUploader.propTypes = {
  /** Callback function called when images change */
  onImagesChange: PropTypes.func,
  
  /** Initial images to display */
  initialImages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      file: PropTypes.object,
      name: PropTypes.string.isRequired,
      size: PropTypes.number.isRequired,
      preview: PropTypes.string.isRequired,
      uploadProgress: PropTypes.number,
      uploaded: PropTypes.bool
    })
  ),
  
  /** Maximum number of files allowed */
  maxFiles: PropTypes.number,
  
  /** Maximum file size in bytes */
  maxFileSize: PropTypes.number,
  
  /** Whether the uploader is disabled */
  disabled: PropTypes.bool,
  
  /** Whether upload is in progress */
  loading: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string
};

export default ImageUploader;