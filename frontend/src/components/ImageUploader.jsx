// frontend/src/components/ImageUploader.jsx - FIXED VERSION
// CRITICAL FIX: Added type="button" to prevent form submission

import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Image Uploader Component - FIXED to prevent automatic form submission
 * 
 * CRITICAL FIX: Added type="button" to all buttons to prevent form submission
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
   */
  const validateFile = useCallback((file) => {
    const errors = [];
    
    if (!Object.keys(acceptedFileTypes).includes(file.type)) {
      errors.push(`${file.name}: Invalid file type. Only images are allowed.`);
    }
    
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
   * FIXED: Handles image removal - NO FORM SUBMISSION
   */
  const handleRemoveImage = useCallback((imageId) => {
    console.log('🗑️ Removing image:', imageId);
    
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
    
    console.log('✅ Image removed - NO FORM SUBMISSION');
  }, [onImagesChange]);

  /**
   * Handles new file drops/selections
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
  
  const hasImages = images.length > 0;
  const canAddMore = images.length < maxFiles;
  const remainingSlots = maxFiles - images.length;

  const dropzoneClassName = useMemo(() => {
    const baseClasses = 'dropzone min-h-[200px] flex flex-col items-center justify-center p-8 text-center transition-all duration-300';
    
    if (disabled || loading) {
      return `${baseClasses} opacity-50 cursor-not-allowed`;
    }
    
    if (isDragReject) {
      return `${baseClasses} dropzone-reject`;
    }
    
    if (isDragAccept) {
      return `${baseClasses} dropzone-accept`;
    }
    
    if (isDragActive) {
      return `${baseClasses} dropzone-active`;
    }
    
    return baseClasses;
  }, [disabled, loading, isDragActive, isDragAccept, isDragReject]);

  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
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
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.1,
        ease: 'easeIn'
      }
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  const renderDropzone = () => (
    <motion.div
      {...getRootProps()}
      className={dropzoneClassName}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="dropzone"
    >
      <input {...getInputProps()} data-testid="file-input" />
      
      <motion.div
        className="flex flex-col items-center space-y-4"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="relative">
          <Upload className="w-12 h-12 text-blue-400 mx-auto" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="spinner w-6 h-6 border-2 border-blue-400"></div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">
            {loading ? 'Uploading Images...' : 'Upload Your Images'}
          </h3>
          
          <p className="text-gray-300">
            {loading 
              ? `Processing ${uploadProgress}%...`
              : isDragActive
                ? 'Drop your images here...'
                : 'Drag and drop images here, or click to browse'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-400">
            <span>
              {canAddMore ? `Up to ${remainingSlots} more file${remainingSlots !== 1 ? 's' : ''}` : 'Maximum files reached'}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Max {maxFileSizeMB}MB each</span>
          </div>
        </div>
        
        {!disabled && !loading && (
          <motion.button
            type="button" // CRITICAL FIX: Prevent form submission
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="glass-button px-6 py-3 text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Choose Files
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );

  const renderErrors = () => {
    if (errors.length === 0) return null;
    
    return (
      <motion.div
        className="glass-effect border-red-400/50 bg-red-500/10 p-4 rounded-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-red-400 font-medium mb-2">Upload Errors</h4>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-red-300 text-sm">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
          <motion.button
            type="button" // CRITICAL FIX: Prevent form submission
            onClick={() => setErrors([])}
            className="text-red-400 hover:text-red-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Dismiss errors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const renderImagePreview = (image, index) => (
    <motion.div
      key={image.id}
      className="relative group"
      variants={imageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <div className="relative aspect-square rounded-lg overflow-hidden glass-effect">
        <img
          src={image.preview}
          alt={image.name}
          className="w-full h-full object-cover"
          onLoad={() => URL.revokeObjectURL(image.preview)}
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

      {/* FIXED: Remove Button with type="button" */}
      <AnimatePresence>
        <motion.button
          type="button" // 🔥 CRITICAL FIX: This prevents form submission!
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          variants={removeButtonVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={(e) => {
            e.preventDefault(); // Extra protection
            e.stopPropagation();
            console.log('🗑️ X button clicked - should NOT submit form');
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
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${image.uploadProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      )}

      {/* Upload Success Indicator */}
      {image.uploaded && (
        <motion.div
          className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <CheckCircle className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <div className={`space-y-6 ${className}`}>
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
                  type="button" // CRITICAL FIX: Prevent form submission
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  onClick={(e) => {
                    e.preventDefault(); // Extra protection
                    console.log('🗑️ Clear All clicked - should NOT submit form');
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
              data-testid="image-grid"
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