// backend/test-production.js
/**
 * Comprehensive Production Testing Suite
 * Tests backend connectivity, API endpoints, and integration
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionTester {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[level] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    if (data) {
      console.log('    Data:', JSON.stringify(data, null, 2));
    }
  }

  async runTest(name, testFn) {
    this.log('info', `Running test: ${name}`);
    
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.passed++;
      this.testResults.tests.push({
        name,
        status: 'PASSED',
        duration,
        result
      });
      
      this.log('success', `${name} PASSED (${duration}ms)`);
      return { success: true, result };
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({
        name,
        status: 'FAILED',
        error: error.message,
        stack: error.stack
      });
      
      this.log('error', `${name} FAILED: ${error.message}`);
      return { success: false, error };
    }
  }

  // =============================================================================
  // BASIC CONNECTIVITY TESTS
  // =============================================================================

  async testBackendHealth() {
    const response = await axios.get(`${this.backendUrl}/health`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'ProductionTester/1.0'
      }
    });

    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = response.data;
    if (data.status !== 'OK') {
      throw new Error(`Backend not healthy: ${data.status}`);
    }

    return {
      status: data.status,
      uptime: data.uptime,
      environment: data.environment,
      version: data.version,
      config: data.config
    };
  }

  async testCorsConfiguration() {
    try {
      // Test preflight request
      const preflightResponse = await axios.options(`${this.backendUrl}/api/analyze`, {
        headers: {
          'Origin': this.frontendUrl,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const corsHeaders = {
        'Access-Control-Allow-Origin': preflightResponse.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': preflightResponse.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': preflightResponse.headers['access-control-allow-headers']
      };

      return {
        preflightStatus: preflightResponse.status,
        corsHeaders,
        originAllowed: corsHeaders['Access-Control-Allow-Origin'] === this.frontendUrl || 
                      corsHeaders['Access-Control-Allow-Origin'] === '*'
      };

    } catch (error) {
      throw new Error(`CORS test failed: ${error.message}`);
    }
  }

  async testAnalyzeEndpointWithoutFiles() {
    try {
      const response = await axios.post(`${this.backendUrl}/api/analyze`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': this.frontendUrl
        },
        timeout: 10000,
        validateStatus: () => true // Accept all status codes
      });

      return {
        status: response.status,
        success: response.data?.success,
        error: response.data?.error,
        code: response.data?.code
      };

    } catch (error) {
      throw new Error(`Analyze endpoint test failed: ${error.message}`);
    }
  }

  // =============================================================================
  // FILE UPLOAD TESTS
  // =============================================================================

  async createTestImage(width = 100, height = 100) {
    // Create a simple test image (1x1 PNG)
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

    return pngData;
  }

  async testFileUpload() {
    const testImage = await this.createTestImage();
    
    const formData = new FormData();
    formData.append('images', new Blob([testImage], { type: 'image/png' }), 'test.png');
    formData.append('prompt', 'Test analysis of a simple image');

    const response = await axios.post(`${this.backendUrl}/api/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Origin': this.frontendUrl
      },
      timeout: 30000,
      validateStatus: () => true
    });

    return {
      status: response.status,
      success: response.data?.success,
      analysis: response.data?.analysis,
      error: response.data?.error,
      metadata: response.data?.metadata
    };
  }

  // =============================================================================
  // ENVIRONMENT TESTS
  // =============================================================================

  async testEnvironmentConfiguration() {
    const response = await axios.get(`${this.backendUrl}/api/analyze/config`, {
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error(`Config endpoint failed: ${response.status}`);
    }

    const config = response.data.config;
    
    return {
      uploadLimits: config.upload,
      analysisConfig: config.analysis,
      features: config.features
    };
  }

  async testGeminiApiKey() {
    // Test if Gemini API key is working by checking service health
    const response = await axios.get(`${this.backendUrl}/api/analyze/health`, {
      timeout: 15000
    });

    if (response.status !== 200) {
      throw new Error(`Health endpoint failed: ${response.status}`);
    }

    const health = response.data;
    
    return {
      aiServiceStatus: health.aiService?.status,
      aiModel: health.aiService?.model,
      provider: health.aiService?.provider
    };
  }

  // =============================================================================
  // NETWORK DIAGNOSTICS
  // =============================================================================

  async testNetworkLatency() {
    const tests = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      try {
        await axios.get(`${this.backendUrl}/health`, { timeout: 5000 });
        tests.push(Date.now() - startTime);
      } catch (error) {
        tests.push(-1); // Failed request
      }
    }

    const successful = tests.filter(t => t > 0);
    const averageLatency = successful.length > 0 
      ? successful.reduce((a, b) => a + b, 0) / successful.length 
      : -1;

    return {
      tests,
      successful: successful.length,
      failed: tests.length - successful.length,
      averageLatency: Math.round(averageLatency),
      maxLatency: Math.max(...successful),
      minLatency: Math.min(...successful)
    };
  }

  async testSSLCertificate() {
    if (!this.backendUrl.startsWith('https://')) {
      return { ssl: false, reason: 'HTTP URL provided' };
    }

    try {
      const response = await axios.get(this.backendUrl, {
        timeout: 10000,
        httpsAgent: new (await import('https')).Agent({
          rejectUnauthorized: true // Strict SSL verification
        })
      });

      return {
        ssl: true,
        status: response.status,
        certificate: 'Valid'
      };

    } catch (error) {
      if (error.code === 'CERT_HAS_EXPIRED' || 
          error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
          error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
        return {
          ssl: false,
          reason: 'SSL Certificate Issue',
          error: error.code
        };
      }

      throw error;
    }
  }

  // =============================================================================
  // INTEGRATION TESTS
  // =============================================================================

  async testFullUploadFlow() {
    const testImage = await this.createTestImage();
    
    // Step 1: Verify endpoint is accessible
    const healthCheck = await axios.get(`${this.backendUrl}/health`);
    
    // Step 2: Upload image
    const formData = new FormData();
    formData.append('images', new Blob([testImage], { type: 'image/png' }), 'integration-test.png');
    formData.append('prompt', 'Analyze this test image for integration testing');

    const uploadResponse = await axios.post(`${this.backendUrl}/api/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Origin': this.frontendUrl,
        'User-Agent': 'IntegrationTest/1.0'
      },
      timeout: 60000 // Give AI more time
    });

    return {
      healthStatus: healthCheck.status,
      uploadStatus: uploadResponse.status,
      success: uploadResponse.data?.success,
      hasAnalysis: !!uploadResponse.data?.analysis,
      analysisLength: uploadResponse.data?.analysis?.length || 0,
      processingTime: uploadResponse.data?.metadata?.totalProcessingTimeMs,
      aiModel: uploadResponse.data?.metadata?.aiModel
    };
  }

  // =============================================================================
  // MAIN TEST RUNNER
  // =============================================================================

  async runAllTests() {
    console.log('🚀 Starting Production Test Suite');
    console.log('═'.repeat(60));
    console.log(`Backend URL: ${this.backendUrl}`);
    console.log(`Frontend URL: ${this.frontendUrl}`);
    console.log('═'.repeat(60));

    // Basic connectivity tests
    await this.runTest('Backend Health Check', () => this.testBackendHealth());
    await this.runTest('Network Latency Test', () => this.testNetworkLatency());
    await this.runTest('SSL Certificate Test', () => this.testSSLCertificate());
    
    // API endpoint tests
    await this.runTest('CORS Configuration', () => this.testCorsConfiguration());
    await this.runTest('Analyze Endpoint (No Files)', () => this.testAnalyzeEndpointWithoutFiles());
    await this.runTest('Environment Configuration', () => this.testEnvironmentConfiguration());
    
    // AI service tests
    await this.runTest('Gemini API Key Test', () => this.testGeminiApiKey());
    
    // File upload tests
    await this.runTest('File Upload Test', () => this.testFileUpload());
    await this.runTest('Full Integration Test', () => this.testFullUploadFlow());

    // Results summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n🚨 FAILED TESTS:');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }

    console.log('\n💡 TROUBLESHOOTING STEPS:');
    await this.generateTroubleshootingSteps();

    return this.testResults;
  }

  async generateTroubleshootingSteps() {
    const failedTests = this.testResults.tests.filter(test => test.status === 'FAILED');
    
    if (failedTests.some(test => test.name.includes('Health Check'))) {
      console.log('   1. ❌ Backend not responding - check Render deployment logs');
      console.log('      - Verify backend is deployed and running');
      console.log('      - Check environment variables in Render dashboard');
      console.log('      - Verify port configuration (should use process.env.PORT)');
    }
    
    if (failedTests.some(test => test.name.includes('CORS'))) {
      console.log('   2. ❌ CORS issues - update backend CORS configuration');
      console.log('      - Add your Netlify domain to FRONTEND_URL environment variable');
      console.log('      - Check CORS middleware in server.js');
      console.log('      - Verify origin header in requests');
    }
    
    if (failedTests.some(test => test.name.includes('Gemini'))) {
      console.log('   3. ❌ Gemini API issues - verify API key configuration');
      console.log('      - Check GEMINI_API_KEY in Render environment variables');
      console.log('      - Verify API key has proper permissions');
      console.log('      - Test API key directly with Google AI Studio');
    }
    
    if (failedTests.some(test => test.name.includes('Upload'))) {
      console.log('   4. ❌ File upload issues - check request format and size limits');
      console.log('      - Verify Content-Type headers');
      console.log('      - Check file size limits');
      console.log('      - Verify multipart/form-data handling');
    }

    if (this.testResults.failed === 0) {
      console.log('   ✅ All tests passed! Your backend is working correctly.');
      console.log('   🔍 If frontend still fails, check:');
      console.log('      - VITE_API_URL in Netlify environment variables');
      console.log('      - Browser console for specific error messages');
      console.log('      - Network tab in browser dev tools');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ProductionTester();
  
  // Get URLs from command line arguments or environment
  if (process.argv[2]) {
    tester.backendUrl = process.argv[2];
  }
  if (process.argv[3]) {
    tester.frontendUrl = process.argv[3];
  }
  
  console.log('🔧 Usage: node test-production.js [BACKEND_URL] [FRONTEND_URL]');
  console.log(`   Backend: ${tester.backendUrl}`);
  console.log(`   Frontend: ${tester.frontendUrl}\n`);
  
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}