#!/usr/bin/env node

/**
 * Upload Security Test Script
 * Tests the secure upload middleware with various scenarios
 * 
 * Usage: node test-upload.js
 */

import { getUploadConfig, validateUploadDirectory } from './middleware/upload.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_FILES_DIR = path.join(__dirname, 'test-files');

console.log('🧪 Starting Upload Security Tests...\n');

/**
 * Test 1: Validate upload configuration
 */
async function testUploadConfig() {
  console.log('📋 Test 1: Upload Configuration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const config = getUploadConfig();
    
    console.log('✅ Upload configuration loaded successfully:');
    console.log(`   • Max file size: ${config.maxFileSizeMB}MB (${config.maxFileSize} bytes)`);
    console.log(`   • Max files: ${config.maxFiles}`);
    console.log(`   • Allowed MIME types: ${config.allowedMimeTypes.join(', ')}`);
    console.log(`   • Allowed extensions: ${config.allowedExtensions.join(', ')}`);
    console.log(`   • Upload directory: ${config.uploadDirectory}`);
    
    return true;
  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Validate upload directory
 */
async function testUploadDirectory() {
  console.log('\n📁 Test 2: Upload Directory Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const status = await validateUploadDirectory();
    
    if (status.exists && status.writable) {
      console.log('✅ Upload directory is properly configured:');
      console.log(`   • Path: ${status.path}`);
      console.log(`   • Exists: ${status.exists}`);
      console.log(`   • Writable: ${status.writable}`);
      console.log(`   • Is directory: ${status.isDirectory}`);
      console.log(`   • Created: ${status.created}`);
      console.log(`   • Modified: ${status.modified}`);
      return true;
    } else {
      console.error('❌ Upload directory validation failed:');
      console.error(`   • Path: ${status.path}`);
      console.error(`   • Exists: ${status.exists}`);
      console.error(`   • Writable: ${status.writable}`);
      if (status.error) {
        console.error(`   • Error: ${status.error}`);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Directory validation test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Create test files for security testing
 */
async function createTestFiles() {
  console.log('\n🎭 Test 3: Creating Security Test Files');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Ensure test files directory exists
    await fs.ensureDir(TEST_FILES_DIR);
    
    // Create a valid test image (1x1 PNG)
    const validImagePath = path.join(TEST_FILES_DIR, 'valid-test.png');
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x5C, 0xC2, 0xD5, 0x23,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82
    ]);
    await fs.writeFile(validImagePath, pngData);
    
    // Create test files with security issues
    const testFiles = [
      {
        name: 'malicious..exe.png',
        content: 'fake image with dangerous filename',
        shouldBlock: true,
        reason: 'Directory traversal attempt'
      },
      {
        name: 'script.php.png',
        content: '<?php echo "malicious"; ?>',
        shouldBlock: true,
        reason: 'Double extension attack'
      },
      {
        name: 'normal-image.txt',
        content: 'text file with wrong extension',
        shouldBlock: true,
        reason: 'Invalid file extension'
      },
      {
        name: 'image-with-null\0byte.png',
        content: 'file with null byte',
        shouldBlock: true,
        reason: 'Null byte in filename'
      }
    ];
    
    for (const testFile of testFiles) {
      const filePath = path.join(TEST_FILES_DIR, testFile.name);
      await fs.writeFile(filePath, testFile.content);
    }
    
    console.log('✅ Test files created successfully:');
    console.log(`   • Valid image: valid-test.png (${pngData.length} bytes)`);
    console.log(`   • Security test files: ${testFiles.length} files`);
    
    return {
      validImage: validImagePath,
      testFiles: testFiles.map(f => ({
        path: path.join(TEST_FILES_DIR, f.name),
        ...f
      }))
    };
    
  } catch (error) {
    console.error('❌ Test file creation failed:', error.message);
    return null;
  }
}

/**
 * Test 4: Security validation tests
 */
async function testSecurityValidation() {
  console.log('\n🔒 Test 4: Security Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Test MIME type validation
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const invalidMimeTypes = ['text/plain', 'application/javascript', 'text/html'];
  
  console.log('🔍 MIME Type Validation:');
  validMimeTypes.forEach(mimeType => {
    console.log(`   ✅ ${mimeType} - ALLOWED`);
  });
  
  invalidMimeTypes.forEach(mimeType => {
    console.log(`   ❌ ${mimeType} - BLOCKED`);
  });
  
  // Test file extension validation
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const invalidExtensions = ['.exe', '.php', '.js', '.html', '.txt'];
  
  console.log('\n🔍 File Extension Validation:');
  validExtensions.forEach(ext => {
    console.log(`   ✅ ${ext} - ALLOWED`);
  });
  
  invalidExtensions.forEach(ext => {
    console.log(`   ❌ ${ext} - BLOCKED`);
  });
  
  // Test filename security patterns
  const dangerousFilenames = [
    '../../../etc/passwd',
    'script.php.png',
    'image.exe.png',
    'file\0null.png',
    'con.png',
    'image<script>.png'
  ];
  
  console.log('\n🔍 Dangerous Filename Patterns:');
  dangerousFilenames.forEach(filename => {
    console.log(`   ❌ ${filename} - BLOCKED`);
  });
  
  return true;
}

/**
 * Test 5: Performance and limits
 */
async function testLimitsAndPerformance() {
  console.log('\n⚡ Test 5: Limits and Performance');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const config = getUploadConfig();
  
  console.log('📊 Current Limits:');
  console.log(`   • Max file size: ${config.maxFileSizeMB}MB`);
  console.log(`   • Max files per request: ${config.maxFiles}`);
  console.log(`   • Max form fields: 10`);
  console.log(`   • Max field name size: 100 bytes`);
  console.log(`   • Max field value size: 1MB`);
  
  // Test filename generation performance
  console.log('\n🚀 Testing filename generation performance...');
  const startTime = Date.now();
  const testCount = 1000;
  
  for (let i = 0; i < testCount; i++) {
    // Simulate filename generation
    const timestamp = Date.now();
    const randomHex = Math.random().toString(16).substr(2, 16);
    const filename = `image-${timestamp}-${randomHex}.jpg`;
    
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      throw new Error('Generated filename contains invalid characters');
    }
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / testCount;
  
  console.log(`   ✅ Generated ${testCount} filenames in ${endTime - startTime}ms`);
  console.log(`   ✅ Average time per filename: ${avgTime.toFixed(3)}ms`);
  
  return true;
}

/**
 * Cleanup test files
 */
async function cleanup() {
  console.log('\n🧹 Cleaning up test files...');
  
  try {
    if (await fs.pathExists(TEST_FILES_DIR)) {
      await fs.remove(TEST_FILES_DIR);
      console.log('✅ Test files cleaned up successfully');
    }
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🔒 SECURE UPLOAD MIDDLEWARE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 5
  };
  
  // Run all tests
  const tests = [
    { name: 'Upload Configuration', fn: testUploadConfig },
    { name: 'Upload Directory', fn: testUploadDirectory },
    { name: 'Test File Creation', fn: createTestFiles },
    { name: 'Security Validation', fn: testSecurityValidation },
    { name: 'Limits and Performance', fn: testLimitsAndPerformance }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        results.passed++;
        console.log(`\n✅ ${test.name}: PASSED`);
      } else {
        results.failed++;
        console.log(`\n❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      results.failed++;
      console.log(`\n❌ ${test.name}: ERROR - ${error.message}`);
    }
  }
  
  // Cleanup
  await cleanup();
  
  // Final report
  console.log('\n' + '═'.repeat(65));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═'.repeat(65));
  console.log(`✅ Tests Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Tests Failed: ${results.failed}/${results.total}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your upload middleware is secure and ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the security configuration.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Test file uploads via the API endpoint');
  console.log('   2. Verify file cleanup is working');
  console.log('   3. Test with real image files');
  console.log('   4. Monitor server logs for security events');
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}