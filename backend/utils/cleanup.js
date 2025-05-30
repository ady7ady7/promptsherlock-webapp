import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

/**
 * Clean up uploaded files immediately after processing
 * This is a critical security feature - no files should persist
 * 
 * @param {Array} files - Array of file objects from multer
 * @returns {Promise<void>}
 */
export const cleanupFiles = async (files) => {
  if (!files || files.length === 0) {
    return;
  }

  const deletePromises = files.map(async (file) => {
    try {
      const filePath = file.path || path.join(UPLOAD_DIR, file.filename);
      
      // Check if file exists before attempting to delete
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        console.log(`✓ Deleted: ${file.filename || file.originalname}`);
      } else {
        console.log(`⚠ File not found (already deleted?): ${file.filename || file.originalname}`);
      }
    } catch (error) {
      console.error(`✗ Failed to delete ${file.filename || file.originalname}:`, error.message);
      // Don't throw error - continue with other files
    }
  });

  try {
    await Promise.all(deletePromises);
    console.log(`Cleanup completed for ${files.length} files`);
  } catch (error) {
    console.error('Some files could not be deleted:', error);
  }
};

/**
 * Clean up a single file by file path
 * 
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
export const cleanupFile = async (filePath) => {
  try {
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      console.log(`✓ Deleted file: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⚠ File not found: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Failed to delete file ${path.basename(filePath)}:`, error.message);
    return false;
  }
};

/**
 * Clean up all files in the uploads directory
 * Used for server shutdown or emergency cleanup
 * 
 * @returns {Promise<number>} - Number of files deleted
 */
export const cleanupAllFiles = async () => {
  try {
    if (!await fs.pathExists(UPLOAD_DIR)) {
      console.log('Upload directory does not exist, nothing to clean');
      return 0;
    }

    const files = await fs.readdir(UPLOAD_DIR);
    
    if (files.length === 0) {
      console.log('Upload directory is already empty');
      return 0;
    }

    console.log(`Found ${files.length} files to clean up`);
    
    const deletePromises = files.map(async (filename) => {
      // Skip .gitkeep and other hidden files
      if (filename.startsWith('.')) {
        return false;
      }
      
      const filePath = path.join(UPLOAD_DIR, filename);
      return await cleanupFile(filePath);
    });

    const results = await Promise.all(deletePromises);
    const deletedCount = results.filter(Boolean).length;
    
    console.log(`Cleanup completed: ${deletedCount} files deleted`);
    return deletedCount;
    
  } catch (error) {
    console.error('Error during bulk cleanup:', error);
    return 0;
  }
};

/**
 * Clean up old files based on age
 * Failsafe in case files somehow persist
 * 
 * @param {number} maxAgeMinutes - Maximum age in minutes (default: 30)
 * @returns {Promise<number>} - Number of files deleted
 */
export const cleanupOldFiles = async (maxAgeMinutes = 30) => {
  try {
    if (!await fs.pathExists(UPLOAD_DIR)) {
      return 0;
    }

    const files = await fs.readdir(UPLOAD_DIR);
    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
    
    let deletedCount = 0;
    
    for (const filename of files) {
      // Skip .gitkeep and other hidden files
      if (filename.startsWith('.')) {
        continue;
      }
      
      const filePath = path.join(UPLOAD_DIR, filename);
      
      try {
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtime.getTime();
        
        if (fileAge > maxAge) {
          await fs.remove(filePath);
          console.log(`✓ Deleted old file (${Math.round(fileAge / 60000)}min old): ${filename}`);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error checking file ${filename}:`, error.message);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old files (older than ${maxAgeMinutes} minutes)`);
    }
    
    return deletedCount;
    
  } catch (error) {
    console.error('Error during old file cleanup:', error);
    return 0;
  }
};

/**
 * Get current upload directory status
 * 
 * @returns {Promise<Object>} - Directory status information
 */
export const getUploadStatus = async () => {
  try {
    if (!await fs.pathExists(UPLOAD_DIR)) {
      return {
        exists: false,
        fileCount: 0,
        totalSize: 0,
        files: []
      };
    }

    const files = await fs.readdir(UPLOAD_DIR);
    const fileInfos = [];
    let totalSize = 0;

    for (const filename of files) {
      if (filename.startsWith('.')) {
        continue; // Skip hidden files
      }
      
      try {
        const filePath = path.join(UPLOAD_DIR, filename);
        const stats = await fs.stat(filePath);
        const fileInfo = {
          name: filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          age: Date.now() - stats.mtime.getTime()
        };
        
        fileInfos.push(fileInfo);
        totalSize += stats.size;
      } catch (error) {
        console.error(`Error reading file stats for ${filename}:`, error.message);
      }
    }

    return {
      exists: true,
      fileCount: fileInfos.length,
      totalSize: totalSize,
      totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      files: fileInfos
    };
    
  } catch (error) {
    console.error('Error getting upload status:', error);
    return {
      exists: false,
      fileCount: 0,
      totalSize: 0,
      files: [],
      error: error.message
    };
  }
};

// If this script is run directly, perform cleanup
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running cleanup utility...');
  
  cleanupAllFiles()
    .then((count) => {
      console.log(`Cleanup completed: ${count} files deleted`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}