const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs-extra')
const path = require('path')

class ScenarioTester {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL
    this.testResults = []
  }

  async runScenario(name, testFunction) {
    console.log(`\n🎯 Running Scenario: ${name}`)
    console.log('─'.repeat(50))
    
    const startTime = Date.now()
    try {
      const result = await testFunction()
      const duration = Date.now() - startTime
      
      this.testResults.push({
        name,
        status: 'PASSED',
        duration,
        details: result
      })
      
      console.log(`✅ ${name}: PASSED (${duration}ms)`)
      return true
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.testResults.push({
        name,
        status: 'FAILED',
        duration,
        error: error.message,
        stack: error.stack
      })
      
      console.log(`❌ ${name}: FAILED (${duration}ms)`)
      console.log(`   Error: ${error.message}`)
      return false
    }
  }

  async createTestImage(name = 'test.jpg', sizeKB = 50) {
    // Create a simple test image buffer
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46])
    const jpegFooter = Buffer.from([0xFF, 0xD9])
    const imageData = Buffer.alloc(sizeKB * 1024 - jpegHeader.length - jpegFooter.length, 0)
    
    return {
      buffer: Buffer.concat([jpegHeader, imageData, jpegFooter]),
      name,
      mimetype: 'image/jpeg'
    }
  }

  // Scenario 1: Single Image Upload and Analysis
  async testSingleImageUpload() {
    const image = await this.createTestImage('single-test.jpg', 100)
    const formData = new FormData()
    formData.append('images', image.buffer, image.name)
    formData.append('prompt', 'Analyze this single test image')

    const response = await axios.post(`${this.baseURL}/api/analyze`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000
    })

    if (!response.data.success) {
      throw new Error(`Analysis failed: ${response.data.error}`)
    }

    if (response.data.metadata.processedImages !== 1) {
      throw new Error(`Expected 1 processed image, got ${response.data.metadata.processedImages}`)
    }

    return {
      processedImages: response.data.metadata.processedImages,
      analysisLength: response.data.analysis.length,
      processingTime: response.data.metadata.totalProcessingTimeMs
    }
  }

  // Scenario 2: Multiple Image Upload (1-10 images)
  async testMultipleImageUpload() {
    const results = []
    
    for (let count = 2; count <= 5; count++) {
      const formData = new FormData()
      
      for (let i = 1; i <= count; i++) {
        const image = await this.createTestImage(`multi-test-${i}.jpg`, 75)
        formData.append('images', image.buffer, image.name)
      }
      
      formData.append('prompt', `Analyze these ${count} test images`)

      const response = await axios.post(`${this.baseURL}/api/analyze`, formData, {
        headers: formData.getHeaders(),
        timeout: 120000
      })

      if (!response.data.success) {
        throw new Error(`Multiple image analysis failed for ${count} images: ${response.data.error}`)
      }

      if (response.data.metadata.processedImages !== count) {
        throw new Error(`Expected ${count} processed images, got ${response.data.metadata.processedImages}`)
      }

      results.push({
        imageCount: count,
        processingTime: response.data.metadata.totalProcessingTimeMs,
        analysisLength: response.data.analysis.length
      })
    }

    return results
  }

  // Scenario 3: File Size Limit Testing
  async testFileSizeLimits() {
    const tests = [
      { size: 5, shouldPass: true, description: '5MB file (within limit)' },
      { size: 10, shouldPass: true, description: '10MB file (at limit)' },
      { size: 15, shouldPass: false, description: '15MB file (over limit)' }
    ]

    const results = []

    for (const test of tests) {
      try {
        const image = await this.createTestImage(`size-test-${test.size}mb.jpg`, test.size * 1024)
        const formData = new FormData()
        formData.append('images', image.buffer, image.name)

        const response = await axios.post(`${this.baseURL}/api/analyze`, formData, {
          headers: formData.getHeaders(),
          timeout: 60000,
          validateStatus: () => true // Accept all status codes
        })

        const actualPassed = response.status === 200 && response.data.success
        
        if (actualPassed !== test.shouldPass) {
          throw new Error(`${test.description}: Expected ${test.shouldPass ? 'PASS' : 'FAIL'}, got ${actualPassed ? 'PASS' : 'FAIL'}`)
        }

        results.push({
          size: test.size,
          expectedResult: test.shouldPass,
          actualResult: actualPassed,
          status: response.status,
          message: response.data.error || 'Success'
        })

      } catch (error) {
        if (!test.shouldPass && error.code === 'ECONNRESET') {
          // Connection reset is expected for oversized files
          results.push({
            size: test.size,
            expectedResult: test.shouldPass,
            actualResult: false,
            status: 'CONNECTION_RESET',
            message: 'Connection reset (expected for large files)'
          })
        } else {
          throw error
        }
      }
    }

    return results
  }

  // Scenario 4: Invalid File Type Handling
  async testInvalidFileTypes() {
    const invalidFiles = [
      { name: 'document.pdf', mimetype: 'application/pdf', content: '%PDF-1.4' },
      { name: 'script.js', mimetype: 'application/javascript', content: 'console.log("test")' },
      { name: 'document.txt', mimetype: 'text/plain', content: 'This is a text file' },
      { name: 'malware.exe', mimetype: 'application/x-msdownload', content: 'MZ\x90\x00' },
      { name: 'archive.zip', mimetype: 'application/zip', content: 'PK\x03\x04' }
    ]

    const results = []

    for (const file of invalidFiles) {
      const formData = new FormData()
      formData.append('images', Buffer.from(file.content), file.name)

      const response = await axios.post(`${this.baseURL}/api/analyze`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000,
        validateStatus: () => true
      })

      // Should always fail for invalid file types
      if (response.status === 200 && response.data.success) {
        throw new Error(`Invalid file type ${file.mimetype} was incorrectly accepted`)
      }

      results.push({
        filename: file.name,
        mimetype: file.mimetype,
        status: response.status,
        rejected: !response.data.success,
        errorCode: response.data.code
      })
    }

    return results
  }

  // Scenario 5: Network Error Handling
  async testNetworkErrorHandling() {
    // Test with invalid endpoint
    try {
      await axios.post(`${this.baseURL}/api/nonexistent`, {}, { timeout: 5000 })
      throw new Error('Expected 404 error for invalid endpoint')
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Expected behavior
      } else {
        throw error
      }
    }

    // Test with malformed request
    try {
      await axios.post(`${this.baseURL}/api/analyze`, 'invalid-data', {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
        validateStatus: () => true
      })
    } catch (error) {
      // Expected to fail
    }

    return { networkErrorHandling: 'PASSED' }
  }

  // Scenario 6: API Rate Limiting
  async testRateLimiting() {
    const requests = []
    const clientIP = '192.168.1.100'

    // Make rapid requests to trigger rate limiting
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.get(`${this.baseURL}/health`, {
          headers: { 'X-Forwarded-For': clientIP },
          timeout: 5000,
          validateStatus: () => true
        })
      )
    }

    const responses = await Promise.all(requests)
    const rateLimitedCount = responses.filter(r => r.status === 429).length

    if (rateLimitedCount === 0) {
      throw new Error('Rate limiting not working - no 429 responses received')
    }

    return {
      totalRequests: requests.length,
      rateLimitedRequests: rateLimitedCount,
      successfulRequests: responses.filter(r => r.status === 200).length
    }
  }

  // Scenario 7: Large File Processing
  async testLargeFileProcessing() {
    // Test with largest allowed file
    const image = await this.createTestImage('large-test.jpg', 9 * 1024) // 9MB
    const formData = new FormData()
    formData.append('images', image.buffer, image.name)
    formData.append('prompt', 'Analyze this large image file')

    const startTime = Date.now()
    const response = await axios.post(`${this.baseURL}/api/analyze`, formData, {
      headers: formData.getHeaders(),
      timeout: 180000 // 3 minutes for large file
    })

    const processingTime = Date.now() - startTime

    if (!response.data.success) {
      throw new Error(`Large file processing failed: ${response.data.error}`)
    }

    return {
      fileSize: '9MB',
      processingTime,
      success: true,
      analysisLength: response.data.analysis.length
    }
  }

  // Scenario 8: Concurrent User Testing
  async testConcurrentUsers() {
    const concurrentRequests = 5
    const promises = []

    for (let i = 0; i < concurrentRequests; i++) {
      const testConcurrentRequest = async () => {
        const image = await this.createTestImage(`concurrent-${i}.jpg`, 50)
        const formData = new FormData()
        formData.append('images', image.buffer, image.name)
        formData.append('prompt', `Concurrent test request ${i + 1}`)

        const startTime = Date.now()
        const response = await axios.post(`${this.baseURL}/api/analyze`, formData, {
          headers: formData.getHeaders(),
          timeout: 120000
        })

        return {
          requestId: i + 1,
          processingTime: Date.now() - startTime,
          success: response.data.success,
          status: response.status
        }
      }

      promises.push(testConcurrentRequest())
    }

    const results = await Promise.all(promises)
    const successful = results.filter(r => r.success).length

    if (successful < concurrentRequests * 0.8) { // Allow 20% failure rate
      throw new Error(`Too many concurrent requests failed: ${successful}/${concurrentRequests}`)
    }

    return {
      totalRequests: concurrentRequests,
      successfulRequests: successful,
      averageProcessingTime: Math.round(
        results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
      ),
      results
    }
  }

  async runAllScenarios() {
    console.log('🎭 STARTING COMPREHENSIVE SCENARIO TESTING')
    console.log('═'.repeat(60))

    const scenarios = [
      { name: 'Single Image Upload', test: this.testSingleImageUpload },
      { name: 'Multiple Image Upload', test: this.testMultipleImageUpload },
      { name: 'File Size Limits', test: this.testFileSizeLimits },
      { name: 'Invalid File Types', test: this.testInvalidFileTypes },
      { name: 'Network Error Handling', test: this.testNetworkErrorHandling },
      { name: 'API Rate Limiting', test: this.testRateLimiting },
      { name: 'Large File Processing', test: this.testLargeFileProcessing },
      { name: 'Concurrent Users', test: this.testConcurrentUsers }
    ]

    let passedCount = 0

    for (const scenario of scenarios) {
      const passed = await this.runScenario(scenario.name, scenario.test.bind(this))
      if (passed) passedCount++
    }

    console.log('\n' + '═'.repeat(60))
    console.log('📊 SCENARIO TEST SUMMARY')
    console.log('═'.repeat(60))
    console.log(`✅ Passed: ${passedCount}/${scenarios.length}`)
    console.log(`❌ Failed: ${scenarios.length - passedCount}/${scenarios.length}`)
    console.log(`📈 Success Rate: ${Math.round((passedCount / scenarios.length) * 100)}%`)

    return {
      total: scenarios.length,
      passed: passedCount,
      failed: scenarios.length - passedCount,
      successRate: Math.round((passedCount / scenarios.length) * 100),
      results: this.testResults
    }
  }
}

module.exports = ScenarioTester

// Run if called directly
if (require.main === module) {
  const tester = new ScenarioTester()
  tester.runAllScenarios()
    .then(results => {
      console.log('\n🎉 All scenario tests completed!')
      process.exit(results.failed === 0 ? 0 : 1)
    })
    .catch(error => {
      console.error('🚨 Scenario testing failed:', error)
      process.exit(1)
    })
}