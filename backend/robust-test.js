// backend/robust-test.js
/**
 * Robust production test script with improved error handling
 * Includes timeouts, connection checks, and verbose output
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

class RobustTester {
  constructor() {
    this.backendUrl = process.argv[2] || 'http://localhost:5000';
    this.frontendUrl = process.argv[3] || 'http://localhost:5173';
    this.results = { passed: 0, failed: 0, tests: [] };
  }

  log(level, message, data = null) {
    const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️', debug: '🔍' };
    const icon = icons[level] || '📋';
    console.log(`${icon} ${message}`);
    if (data) {
      console.log('    ', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    }
  }

  // Enhanced HTTP request with better error handling
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 15000; // 15 seconds
      
      this.log('debug', `Making ${options.method || 'GET'} request to: ${url}`);
      
      try {
        const urlObj = new URL(url);
        const requestModule = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: options.method || 'GET',
          headers: {
            'User-Agent': 'RobustTester/1.0',
            ...options.headers
          },
          timeout: timeout,
          // Add these for better connection handling
          keepAlive: false,
          rejectUnauthorized: true
        };

        this.log('debug', `Request options:`, {
          hostname: requestOptions.hostname,
          port: requestOptions.port,
          path: requestOptions.path,
          method: requestOptions.method
        });

        const req = requestModule.request(requestOptions, (res) => {
          this.log('debug', `Response received: ${res.statusCode}`);
          
          let data = '';
          let chunks = 0;
          
          res.on('data', (chunk) => {
            chunks++;
            data += chunk;
            this.log('debug', `Received chunk ${chunks}, total size: ${data.length} bytes`);
          });
          
          res.on('end', () => {
            this.log('debug', `Response complete, total size: ${data.length} bytes`);
            
            try {
              const jsonData = data.trim() ? JSON.parse(data) : {};
              resolve({
                status: res.statusCode,
                headers: res.headers,
                data: jsonData,
                rawData: data
              });
            } catch (error) {
              this.log('debug', `JSON parse error: ${error.message}`);
              resolve({
                status: res.statusCode,
                headers: res.headers,
                data: null,
                rawData: data,
                parseError: error.message
              });
            }
          });
        });

        // Enhanced error handling
        req.on('error', (error) => {
          this.log('debug', `Request error: ${error.code} - ${error.message}`);
          reject(new Error(`Network error (${error.code}): ${error.message}`));
        });

        req.on('timeout', () => {
          this.log('debug', `Request timeout after ${timeout}ms`);
          req.destroy();
          reject(new Error(`Request timeout after ${timeout}ms`));
        });

        req.on('abort', () => {
          this.log('debug', 'Request aborted');
          reject(new Error('Request aborted'));
        });

        // Set a backup timeout
        const backupTimeout = setTimeout(() => {
          this.log('debug', 'Backup timeout triggered');
          req.destroy();
          reject(new Error(`Backup timeout after ${timeout + 5000}ms`));
        }, timeout + 5000);

        req.on('close', () => {
          clearTimeout(backupTimeout);
        });

        if (options.body) {
          this.log('debug', `Writing body: ${options.body.substring(0, 100)}...`);
          req.write(options.body);
        }

        req.end();
        
      } catch (error) {
        this.log('debug', `URL parsing error: ${error.message}`);
        reject(new Error(`Invalid URL: ${error.message}`));
      }
    });
  }

  async runTest(name, testFn) {
    console.log('\n' + '─'.repeat(50));
    this.log('info', `Starting test: ${name}`);
    console.log('─'.repeat(50));
    
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED', duration, result });
      this.log('success', `${name} PASSED (${duration}ms)`);
      return { success: true, result };
      
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      this.log('error', `${name} FAILED: ${error.message}`);
      
      // Add specific troubleshooting for this test
      this.provideTroubleshooting(name, error);
      
      return { success: false, error };
    }
  }

  provideTroubleshooting(testName, error) {
    console.log('\n💡 Immediate troubleshooting for this test:');
    
    if (error.message.includes('timeout')) {
      console.log('   • The server is not responding - likely deployment issue');
      console.log('   • Check if your Render service is active and deployed');
      console.log('   • Verify the URL is correct');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('   • DNS resolution failed - the domain does not exist');
      console.log('   • Check if your Render service URL is correct');
      console.log('   • Make sure the service is deployed and active');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   • Connection refused - service is not running');
      console.log('   • Check Render dashboard for service status');
      console.log('   • Verify the service is not sleeping (free tier)');
    } else if (error.message.includes('CORS')) {
      console.log('   • CORS configuration issue');
      console.log(`   • Set FRONTEND_URL=${this.frontendUrl} in Render environment`);
    }
  }

  // Test 1: Basic connectivity
  async testBasicConnectivity() {
    this.log('info', 'Testing basic connectivity to backend...');
    
    const response = await this.makeRequest(`${this.backendUrl}`, {
      timeout: 20000 // Extra long timeout for first test
    });
    
    this.log('debug', `Root endpoint response:`, {
      status: response.status,
      hasData: !!response.data,
      dataType: typeof response.data
    });
    
    if (response.status < 200 || response.status >= 400) {
      throw new Error(`Backend not accessible: HTTP ${response.status}`);
    }
    
    return {
      status: response.status,
      accessible: true,
      service: response.data?.service || 'Unknown',
      responseTime: 'OK'
    };
  }

  // Test 2: Health endpoint
  async testHealthEndpoint() {
    this.log('info', 'Testing health endpoint...');
    
    const response = await this.makeRequest(`${this.backendUrl}/health`);
    
    if (response.status !== 200) {
      throw new Error(`Health check failed: HTTP ${response.status}`);
    }
    
    if (!response.data || response.data.status !== 'OK') {
      throw new Error(`Backend not healthy: ${response.data?.status || 'Unknown status'}`);
    }
    
    return {
      status: response.status,
      health: response.data.status,
      uptime: response.data.uptime,
      environment: response.data.environment,
      config: response.data.config
    };
  }

  // Test 3: CORS check
  async testCorsHeaders() {
    this.log('info', 'Testing CORS configuration...');
    
    const response = await this.makeRequest(`${this.backendUrl}/api/analyze`, {
      method: 'OPTIONS',
      headers: {
        'Origin': this.frontendUrl,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    this.log('debug', 'CORS response headers:', response.headers);

    const allowOrigin = response.headers['access-control-allow-origin'];
    const allowMethods = response.headers['access-control-allow-methods'];
    
    const originAllowed = allowOrigin === this.frontendUrl || allowOrigin === '*';
    
    if (!originAllowed && response.status !== 200 && response.status !== 204) {
      throw new Error(`CORS not configured for ${this.frontendUrl}. Got: ${allowOrigin}`);
    }

    return {
      status: response.status,
      allowOrigin,
      allowMethods,
      originAllowed,
      requestOrigin: this.frontendUrl
    };
  }

  // Test 4: API endpoint functionality
  async testApiEndpoint() {
    this.log('info', 'Testing API endpoint...');
    
    const response = await this.makeRequest(`${this.backendUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': this.frontendUrl
      },
      body: JSON.stringify({})
    });

    this.log('debug', `API response:`, {
      status: response.status,
      data: response.data
    });

    if (response.status === 403) {
      throw new Error('CORS blocking request - check FRONTEND_URL environment variable in Render');
    }
    
    if (response.status === 500) {
      const errorMsg = response.data?.error || 'Unknown server error';
      throw new Error(`Server error - check Render logs: ${errorMsg}`);
    }

    // We expect 400 for empty request
    const isExpectedError = response.status === 400 && 
                           response.data?.error?.toLowerCase().includes('no images');

    return {
      status: response.status,
      success: response.data?.success,
      error: response.data?.error,
      code: response.data?.code,
      behavesCorrectly: isExpectedError
    };
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 Robust Production Test Suite');
    console.log('═'.repeat(60));
    console.log(`Backend URL:  ${this.backendUrl}`);
    console.log(`Frontend URL: ${this.frontendUrl}`);
    console.log(`Test started: ${new Date().toISOString()}`);
    console.log('═'.repeat(60));

    // Run tests sequentially with detailed output
    await this.runTest('Basic Connectivity', () => this.testBasicConnectivity());
    await this.runTest('Health Endpoint', () => this.testHealthEndpoint());
    await this.runTest('CORS Configuration', () => this.testCorsHeaders());
    await this.runTest('API Endpoint', () => this.testApiEndpoint());

    // Final summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 FINAL RESULTS');
    console.log('═'.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);

    // Detailed failure analysis
    const failedTests = this.results.tests.filter(test => test.status === 'FAILED');
    if (failedTests.length > 0) {
      console.log('\n🚨 DETAILED FAILURE ANALYSIS:');
      failedTests.forEach((test, index) => {
        console.log(`\n${index + 1}. ${test.name}:`);
        console.log(`   Error: ${test.error}`);
      });
    }

    // Overall troubleshooting
    console.log('\n💡 NEXT STEPS:');
    if (this.results.failed === 0) {
      console.log('   🎉 All backend tests passed!');
      console.log('   If frontend still fails:');
      console.log(`   1. Set VITE_API_URL=${this.backendUrl} in Netlify`);
      console.log('   2. Redeploy your frontend');
      console.log('   3. Clear browser cache');
    } else {
      console.log('   1. Check Render service status and logs');
      console.log('   2. Verify environment variables are set correctly');
      console.log('   3. Ensure service is deployed and not sleeping');
      console.log(`   4. Test manually: open ${this.backendUrl}/health in browser`);
    }

    return this.results;
  }
}

// Immediate execution check
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔧 Robust Test Script Starting...');
  console.log('═'.repeat(40));
  
  if (process.argv.length < 4) {
    console.log('❌ Missing required arguments!');
    console.log('');
    console.log('Usage: node robust-test.js [BACKEND_URL] [FRONTEND_URL]');
    console.log('Example: node robust-test.js https://your-backend.onrender.com https://your-frontend.netlify.app');
    console.log('');
    process.exit(1);
  }
  
  const tester = new RobustTester();
  
  // Start tests immediately
  tester.runAllTests()
    .then(results => {
      console.log('\n🏁 Test suite completed');
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test suite crashed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
}