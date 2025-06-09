#!/usr/bin/env node

/**
 * =============================================================================
 * CI VALIDATION SCRIPT FOR IMAGEANALYZER FRONTEND
 * =============================================================================
 * Validates environment and dependencies before CI build
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

/**
 * Validate package.json and package-lock.json consistency
 */
function validatePackageFiles() {
  logInfo('Validating package files...')
  
  const packageJsonPath = path.join(projectRoot, 'package.json')
  const packageLockPath = path.join(projectRoot, 'package-lock.json')
  
  // Check package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json not found')
    return false
  }
  
  // Check package-lock.json exists
  if (!fs.existsSync(packageLockPath)) {
    logError('package-lock.json not found - run "npm install" first')
    return false
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'))
    
    // Validate package names match
    if (packageJson.name !== packageLock.name) {
      logError(`Package name mismatch: ${packageJson.name} vs ${packageLock.name}`)
      return false
    }
    
    // Validate versions match
    if (packageJson.version !== packageLock.version) {
      logWarning(`Version mismatch: ${packageJson.version} vs ${packageLock.version}`)
    }
    
    // Check for critical dependencies
    const criticalDeps = ['react', 'react-dom', 'vite', 'terser']
    const missingDeps = criticalDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    )
    
    if (missingDeps.length > 0) {
      logError(`Missing critical dependencies: ${missingDeps.join(', ')}`)
      return false
    }
    
    logSuccess('Package files are valid')
    return true
    
  } catch (error) {
    logError(`Error parsing package files: ${error.message}`)
    return false
  }
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  logInfo('Validating environment variables...')
  
  const requiredEnvVars = [
    'VITE_API_URL',
    'VITE_MAX_FILE_SIZE',
    'VITE_MAX_FILES',
    'VITE_APP_NAME'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    logWarning(`Missing environment variables: ${missingVars.join(', ')}`)
    logInfo('These will use default values during build')
  }
  
  // Validate API URL format
  const apiUrl = process.env.VITE_API_URL
  if (apiUrl && !apiUrl.match(/^https?:\/\/.+/)) {
    logError(`Invalid VITE_API_URL format: ${apiUrl}`)
    return false
  }
  
  // Validate numeric values
  const maxFileSize = process.env.VITE_MAX_FILE_SIZE
  if (maxFileSize && (isNaN(maxFileSize) || parseInt(maxFileSize) <= 0)) {
    logError(`Invalid VITE_MAX_FILE_SIZE: ${maxFileSize}`)
    return false
  }
  
  const maxFiles = process.env.VITE_MAX_FILES
  if (maxFiles && (isNaN(maxFiles) || parseInt(maxFiles) <= 0)) {
    logError(`Invalid VITE_MAX_FILES: ${maxFiles}`)
    return false
  }
  
  logSuccess('Environment validation passed')
  return true
}

/**
 * Validate Node.js and npm versions
 */
function validateNodeEnvironment() {
  logInfo('Validating Node.js environment...')
  
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0])
  
  if (majorVersion < 18) {
    logError(`Node.js ${majorVersion} is not supported. Requires Node.js 18+`)
    return false
  }
  
  logSuccess(`Node.js ${nodeVersion} is supported`)
  
  // Check if we're in CI environment
  if (process.env.CI === 'true') {
    logInfo('Running in CI environment')
    
    // CI-specific validations
    if (!process.env.NODE_ENV) {
      logWarning('NODE_ENV not set in CI')
    }
    
    if (process.env.NODE_ENV !== 'production') {
      logWarning(`NODE_ENV is "${process.env.NODE_ENV}", expected "production"`)
    }
  }
  
  return true
}

/**
 * Validate project structure
 */
function validateProjectStructure() {
  logInfo('Validating project structure...')
  
  const requiredFiles = [
    'package.json',
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'src/main.jsx',
    'src/App.jsx',
    'index.html'
  ]
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(projectRoot, file))
  )
  
  if (missingFiles.length > 0) {
    logError(`Missing required files: ${missingFiles.join(', ')}`)
    return false
  }
  
  logSuccess('Project structure is valid')
  return true
}

/**
 * Main validation function
 */
async function main() {
  log('\n' + '='.repeat(60), 'cyan')
  log('🔍 IMAGEANALYZER CI VALIDATION', 'cyan')
  log('='.repeat(60), 'cyan')
  
  const validations = [
    validateNodeEnvironment,
    validateProjectStructure,
    validatePackageFiles,
    validateEnvironment
  ]
  
  let allPassed = true
  
  for (const validation of validations) {
    try {
      const result = await validation()
      if (!result) {
        allPassed = false
      }
    } catch (error) {
      logError(`Validation failed: ${error.message}`)
      allPassed = false
    }
    console.log() // Add spacing
  }
  
  if (allPassed) {
    log('🎉 All validations passed! Ready for CI build', 'green')
    process.exit(0)
  } else {
    log('💥 Some validations failed. Please fix before deploying', 'red')
    process.exit(1)
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logError(`Validation script failed: ${error.message}`)
    process.exit(1)
  })
}