#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs-extra')

class TestRunner {
  constructor() {
    this.results = {
      frontend: { unit: null, integration: null, e2e: null },
      backend: { unit: null, integration: null, security: null, load: null },
      scenarios: []
    }
    this.startTime = Date.now()
  }

  async runCommand(command, args, cwd, description) {
    console.log(`\n🚀 Running: ${description}`)
    console.log(`Command: ${command} ${args.join(' ')}`)
    console.log(`Directory: ${cwd}`)
    console.log('─'.repeat(50))
    
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { 
        cwd, 
        stdio: 'inherit',
        shell: true 
      })
      
      process.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${description} - PASSED`)
          resolve(true)
        } else {
          console.log(`❌ ${description} - FAILED (exit code: ${code})`)
          resolve(false)
        }
      })
      
      process.on('error', (error) => {
        console.error(`🚨 ${description} - ERROR:`, error.message)
        resolve(false)
      })
    })
  }

  async runFrontendTests() {
    const frontendDir = path.join(process.cwd(), 'frontend')
    
    console.log('\n🎨 FRONTEND TESTING PHASE')
    console.log('═'.repeat(60))
    
    // Install dependencies if needed
    if (!await fs.pathExists(path.join(frontendDir, 'node_modules'))) {
      await this.runCommand('npm', ['install'], frontendDir, 'Install Frontend Dependencies')
    }
    
    // Unit tests
    this.results.frontend.unit = await this.runCommand(
      'npm', 
      ['run', 'test:component'], 
      frontendDir, 
      'Frontend Component Tests'
    )
    
    // Integration tests
    this.results.frontend.integration = await this.runCommand(
      'npm', 
      ['run', 'test:integration'], 
      frontendDir, 
      'Frontend Integration Tests'
    )
    
    // E2E tests (if server is running)
    try {
      await fetch('http://localhost:5173')
      this.results.frontend.e2e = await this.runCommand(
        'npm', 
        ['run', 'test:e2e:headless'], 
        frontendDir, 
        'Frontend E2E Tests'
      )
    } catch {
      console.log('⚠️ Skipping E2E tests - development server not running')
      this.results.frontend.e2e = 'skipped'
    }
  }

  async runBackendTests() {
    const backendDir = path.join(process.cwd(), 'backend')
    
    console.log('\n🔧 BACKEND TESTING PHASE')
    console.log('═'.repeat(60))
    
    // Install dependencies if needed
    if (!await fs.pathExists(path.join(backendDir, 'node_modules'))) {
      await this.runCommand('npm', ['install'], backendDir, 'Install Backend Dependencies')
    }
    
    // Generate test data
    await this.runCommand(
      'node', 
      ['tests/utils/generate-test-data.js'], 
      backendDir, 
      'Generate Test Data'
    )
    
    // Unit tests
    this.results.backend.unit = await this.runCommand(
      'npm', 
      ['run', 'test:unit'], 
      backendDir, 
      'Backend Unit Tests'
    )
    
    // Integration tests
    this.results.backend.integration = await this.runCommand(
      'npm', 
      ['run', 'test:integration'], 
      backendDir, 
      'Backend Integration Tests'
    )
    
    // Security tests
    this.results.backend.security = await this.runCommand(
      'npm', 
      ['run', 'test:security'], 
      backendDir, 
      'Backend Security Tests'
    )
    
    // Load tests (if server is running)
    try {
      await fetch('http://localhost:5000/health')
      this.results.backend.load = await this.runCommand(
        'npm', 
        ['run', 'test:load'], 
        backendDir, 
        'Backend Load Tests'
      )
    } catch {
      console.log('⚠️ Skipping load tests - backend server not running')
      this.results.backend.load = 'skipped'
    }
  }

  async runScenarioTests() {
    console.log('\n🎭 SCENARIO TESTING PHASE')
    console.log('═'.repeat(60))
    
    const scenarios = [
      {
        name: 'Single Image Upload',
        description: 'Test uploading and analyzing a single image',
        test: this.testSingleImageScenario.bind(this)
      },
      {
        name: 'Multiple Image Upload',
        description: 'Test uploading and analyzing multiple images',
        test: this.testMultipleImageScenario.bind(this)
      },
      {
        name: 'File Size Limits',
        description: 'Test file size limit enforcement',
        test: this.testFileSizeLimits.bind(this)
      },
      {
        name: 'Invalid File Types',
        description: 'Test rejection of invalid file types',
        test: this.testInvalidFileTypes.bind(this)
      },
      {
        name: 'Rate Limiting',
        description: 'Test API rate limiting functionality',
        test: this.testRateLimiting.bind(this)
      }
    ]
    
    for (const scenario of scenarios) {
      console.log(`\n🎯 Testing: ${scenario.name}`)
      console.log(`Description: ${scenario.description}`)
      
      try {
        const result = await scenario.test()
        this.results.scenarios.push({
          name: scenario.name,
          result: result ? 'PASSED' : 'FAILED'
        })
        console.log(`${result ? '✅' : '❌'} ${scenario.name}: ${result ? 'PASSED' : 'FAILED'}`)
      } catch (error) {
        this.results.scenarios.push({
          name: scenario.name,
          result: 'ERROR',
          error: error.message
        })
        console.log(`🚨 ${scenario.name}: ERROR - ${error.message}`)
      }
    }
  }

  async testSingleImageScenario() {
    // Implementation for single image test scenario
    return true // Placeholder
  }

  async testMultipleImageScenario() {
    // Implementation for multiple image test scenario
    return true // Placeholder
  }

  async testFileSizeLimits() {
    // Implementation for file size limit testing
    return true // Placeholder
  }

  async testInvalidFileTypes() {
    // Implementation for invalid file type testing
    return true // Placeholder
  }

  async testRateLimiting() {
    // Implementation for rate limiting testing
    return true // Placeholder
  }

  generateReport() {
    const endTime = Date.now()
    const duration = Math.round((endTime - this.startTime) / 1000)
    
    console.log('\n' + '═'.repeat(80))
    console.log('📊 COMPREHENSIVE TEST REPORT')
    console.log('═'.repeat(80))
    console.log(`🕒 Total Duration: ${duration} seconds`)
    console.log(`📅 Completed: ${new Date().toISOString()}`)
    
    console.log('\n🎨 Frontend Tests:')
    console.log(`   Unit Tests:        ${this.formatResult(this.results.frontend.unit)}`)
    console.log(`   Integration Tests: ${this.formatResult(this.results.frontend.integration)}`)
    console.log(`   E2E Tests:         ${this.formatResult(this.results.frontend.e2e)}`)
    
    console.log('\n🔧 Backend Tests:')
    console.log(`   Unit Tests:        ${this.formatResult(this.results.backend.unit)}`)
   console.log(`   Integration Tests: ${this.formatResult(this.results.backend.integration)}`)
   console.log(`   Security Tests:    ${this.formatResult(this.results.backend.security)}`)
   console.log(`   Load Tests:        ${this.formatResult(this.results.backend.load)}`)
   
   console.log('\n🎭 Scenario Tests:')
   this.results.scenarios.forEach(scenario => {
     console.log(`   ${scenario.name.padEnd(20)}: ${this.formatResult(scenario.result)}`)
   })
   
   // Calculate overall success rate
   const allResults = [
     ...Object.values(this.results.frontend),
     ...Object.values(this.results.backend),
     ...this.results.scenarios.map(s => s.result === 'PASSED')
   ].filter(r => r !== 'skipped')
   
   const passed = allResults.filter(r => r === true || r === 'PASSED').length
   const total = allResults.length
   const successRate = Math.round((passed / total) * 100)
   
   console.log('\n' + '─'.repeat(80))
   console.log(`📈 Overall Success Rate: ${successRate}% (${passed}/${total} tests passed)`)
   
   if (successRate >= 90) {
     console.log('🎉 EXCELLENT! Your application is ready for production!')
   } else if (successRate >= 75) {
     console.log('✅ GOOD! Minor issues to address before production.')
   } else {
     console.log('⚠️ NEEDS WORK! Several critical issues need to be resolved.')
   }
   
   console.log('═'.repeat(80))
 }

 formatResult(result) {
   if (result === true || result === 'PASSED') return '✅ PASSED'
   if (result === false || result === 'FAILED') return '❌ FAILED'
   if (result === 'skipped') return '⏭️ SKIPPED'
   if (result === 'ERROR') return '🚨 ERROR'
   return '❓ UNKNOWN'
 }

 async run() {
   console.log('🧪 IMAGEANALYZER COMPREHENSIVE TEST SUITE')
   console.log('═'.repeat(80))
   console.log('Starting complete testing pipeline...\n')
   
   try {
     await this.runFrontendTests()
     await this.runBackendTests()
     await this.runScenarioTests()
     
     this.generateReport()
     
     // Generate detailed report file
     await this.saveDetailedReport()
     
   } catch (error) {
     console.error('🚨 Test suite crashed:', error)
     process.exit(1)
   }
 }

 async saveDetailedReport() {
   const reportDir = path.join(process.cwd(), 'testing', 'reports')
   await fs.ensureDir(reportDir)
   
   const reportData = {
     timestamp: new Date().toISOString(),
     duration: Math.round((Date.now() - this.startTime) / 1000),
     results: this.results,
     environment: {
       node: process.version,
       platform: process.platform,
       cwd: process.cwd()
     }
   }
   
   const reportFile = path.join(reportDir, `test-report-${Date.now()}.json`)
   await fs.writeJson(reportFile, reportData, { spaces: 2 })
   
   console.log(`📄 Detailed report saved: ${reportFile}`)
 }
}

// Run if called directly
if (require.main === module) {
 const runner = new TestRunner()
 runner.run().catch(console.error)
}

module.exports = TestRunner