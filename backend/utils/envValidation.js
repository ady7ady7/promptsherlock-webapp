import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Environment variable validation and configuration utility
 * Ensures all required environment variables are properly set
 */

// =============================================================================
// ENVIRONMENT VARIABLE DEFINITIONS
// =============================================================================

/**
 * Required environment variables that must be set
 */
const REQUIRED_ENV_VARS = [
  {
    name: 'GEMINI_API_KEY',
    description: 'Google Gemini API key for AI image analysis',
    validation: (value) => {
      if (!value) return 'API key is required';
      if (!value.startsWith('AIza')) return 'API key should start with "AIza"';
      if (value.length < 20) return 'API key appears to be too short';
      return null;
    }
  }
];

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = [
  {
    name: 'PORT',
    defaultValue: '5000',
    validation: (value) => {
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        return 'Port must be a number between 1 and 65535';
      }
      return null;
    }
  },
  {
    name: 'NODE_ENV',
    defaultValue: 'development',
    validation: (value) => {
      const validEnvs = ['development', 'production', 'test'];
      if (!validEnvs.includes(value)) {
        return `NODE_ENV must be one of: ${validEnvs.join(', ')}`;
      }
      return null;
    }
  },
  {
    name: 'FRONTEND_URL',
    defaultValue: 'http://localhost:5173',
    validation: (value) => {
      try {
        new URL(value);
        return null;
      } catch {
        return 'FRONTEND_URL must be a valid URL';
      }
    }
  },
  {
    name: 'AI_MODEL',
    defaultValue: 'gemini-1.5-flash',
    validation: (value) => {
      const validModels = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash-exp',
        'gemini-1.0-pro'
      ];
      if (!validModels.includes(value)) {
        return `AI_MODEL must be one of: ${validModels.join(', ')}`;
      }
      return null;
    }
  },
  {
    name: 'MAX_FILE_SIZE',
    defaultValue: '10485760',
    validation: (value) => {
      const size = parseInt(value);
      if (isNaN(size) || size < 1 || size > 50 * 1024 * 1024) {
        return 'MAX_FILE_SIZE must be between 1 byte and 50MB';
      }
      return null;
    }
  },
  {
    name: 'MAX_FILES',
    defaultValue: '10',
    validation: (value) => {
      const count = parseInt(value);
      if (isNaN(count) || count < 1 || count > 20) {
        return 'MAX_FILES must be between 1 and 20';
      }
      return null;
    }
  },
  {
    name: 'UPLOAD_DIR',
    defaultValue: 'uploads',
    validation: (value) => {
      if (value.includes('..') || value.startsWith('/')) {
        return 'UPLOAD_DIR must be a relative path without ".."';
      }
      return null;
    }
  },
  {
    name: 'AI_MAX_TOKENS',
    defaultValue: '8192',
    validation: (value) => {
      const tokens = parseInt(value);
      if (isNaN(tokens) || tokens < 100 || tokens > 32000) {
        return 'AI_MAX_TOKENS must be between 100 and 32000';
      }
      return null;
    }
  },
  {
    name: 'AI_TEMPERATURE',
    defaultValue: '0.1',
    validation: (value) => {
      const temp = parseFloat(value);
      if (isNaN(temp) || temp < 0 || temp > 2) {
        return 'AI_TEMPERATURE must be between 0 and 2';
      }
      return null;
    }
  },
  {
    name: 'RATE_LIMIT_WINDOW_MS',
    defaultValue: '900000',
    validation: (value) => {
      const ms = parseInt(value);
      if (isNaN(ms) || ms < 1000) {
        return 'RATE_LIMIT_WINDOW_MS must be at least 1000ms';
      }
      return null;
    }
  },
  {
    name: 'RATE_LIMIT_MAX',
    defaultValue: '100',
    validation: (value) => {
      const max = parseInt(value);
      if (isNaN(max) || max < 1) {
        return 'RATE_LIMIT_MAX must be at least 1';
      }
      return null;
    }
  }
];

/**
 * Production-specific environment variables
 */
const PRODUCTION_ENV_VARS = [
  {
    name: 'FRONTEND_URL',
    description: 'Production frontend URL is required',
    validation: (value) => {
      if (value === 'http://localhost:5173') {
        return 'FRONTEND_URL must be set to production domain, not localhost';
      }
      if (!value.startsWith('https://')) {
        return 'Production FRONTEND_URL must use HTTPS';
      }
      return null;
    }
  }
];

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate a single environment variable
 * @param {Object} envVar - Environment variable definition
 * @returns {Object} Validation result
 */
function validateEnvVar(envVar) {
  const value = process.env[envVar.name] || envVar.defaultValue;
  
  const result = {
    name: envVar.name,
    value: value,
    isSet: !!process.env[envVar.name],
    isValid: true,
    error: null,
    usingDefault: !process.env[envVar.name] && !!envVar.defaultValue
  };

  // Check if required variable is missing
  if (!value && !envVar.defaultValue) {
    result.isValid = false;
    result.error = `${envVar.name} is required but not set`;
    return result;
  }

  // Run custom validation if provided
  if (envVar.validation && value) {
    const validationError = envVar.validation(value);
    if (validationError) {
      result.isValid = false;
      result.error = validationError;
    }
  }

  return result;
}

/**
 * Validate all environment variables
 * @returns {Object} Complete validation results
 */
export function validateEnvironment() {
  const results = {
    isValid: true,
    errors: [],
    warnings: [],
    config: {},
    summary: {
      required: { total: 0, valid: 0, invalid: 0 },
      optional: { total: 0, valid: 0, invalid: 0, usingDefaults: 0 }
    }
  };

  console.log('🔍 Validating environment configuration...\n');

  // Validate required variables
  console.log('📋 Required Variables:');
  console.log('━'.repeat(50));
  
  for (const envVar of REQUIRED_ENV_VARS) {
    const validation = validateEnvVar(envVar);
    results.summary.required.total++;
    
    if (validation.isValid) {
      results.summary.required.valid++;
      results.config[envVar.name] = validation.value;
      console.log(`✅ ${envVar.name}: SET`);
    } else {
      results.summary.required.invalid++;
      results.isValid = false;
      results.errors.push({
        variable: envVar.name,
        error: validation.error,
        description: envVar.description
      });
      console.log(`❌ ${envVar.name}: ${validation.error}`);
    }
  }

  // Validate optional variables
  console.log('\n📋 Optional Variables:');
  console.log('━'.repeat(50));
  
  for (const envVar of OPTIONAL_ENV_VARS) {
    const validation = validateEnvVar(envVar);
    results.summary.optional.total++;
    
    if (validation.isValid) {
      results.summary.optional.valid++;
      results.config[envVar.name] = validation.value;
      
      if (validation.usingDefault) {
        results.summary.optional.usingDefaults++;
        console.log(`⚙️  ${envVar.name}: ${validation.value} (default)`);
      } else {
        console.log(`✅ ${envVar.name}: ${validation.value}`);
      }
    } else {
      results.summary.optional.invalid++;
      results.warnings.push({
        variable: envVar.name,
        error: validation.error
      });
      console.log(`⚠️  ${envVar.name}: ${validation.error}`);
    }
  }

  // Production-specific validation
  if (process.env.NODE_ENV === 'production') {
    console.log('\n🏭 Production Environment Checks:');
    console.log('━'.repeat(50));
    
    for (const envVar of PRODUCTION_ENV_VARS) {
      const validation = validateEnvVar(envVar);
      
      if (!validation.isValid) {
        results.isValid = false;
        results.errors.push({
          variable: envVar.name,
          error: validation.error,
          description: envVar.description
        });
        console.log(`❌ ${envVar.name}: ${validation.error}`);
      } else {
        console.log(`✅ ${envVar.name}: Production ready`);
      }
    }
  }

  return results;
}

/**
 * Check if .env file exists and provide guidance
 */
export function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  const envExists = fs.existsSync(envPath);
  const envExampleExists = fs.existsSync(envExamplePath);
  
  if (!envExists) {
    console.log('⚠️  .env file not found!');
    
    if (envExampleExists) {
      console.log('💡 To get started:');
      console.log('   1. Copy .env.example to .env:');
      console.log('      cp .env.example .env');
      console.log('   2. Edit .env and fill in your values');
      console.log('   3. Get a Gemini API key from https://makersuite.google.com/');
    } else {
      console.log('💡 Create a .env file with required variables');
    }
    
    return false;
  }
  
  return true;
}

/**
 * Get validated configuration object
 * @returns {Object} Validated configuration
 */
export function getValidatedConfig() {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    throw new Error('Environment validation failed. Please check the errors above.');
  }
  
  return validation.config;
}

/**
 * Display environment summary
 */
export function displayEnvironmentSummary() {
  const validation = validateEnvironment();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 ENVIRONMENT VALIDATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Required variables: ${validation.summary.required.valid}/${validation.summary.required.total} valid`);
  console.log(`Optional variables: ${validation.summary.optional.valid}/${validation.summary.optional.total} valid`);
  console.log(`Using defaults: ${validation.summary.optional.usingDefaults} variables`);
  
  if (validation.errors.length > 0) {
    console.log(`\n❌ Errors: ${validation.errors.length}`);
    validation.errors.forEach(error => {
      console.log(`   • ${error.variable}: ${error.error}`);
    });
  }
  
  if (validation.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${validation.warnings.length}`);
    validation.warnings.forEach(warning => {
      console.log(`   • ${warning.variable}: ${warning.error}`);
    });
  }
  
  if (validation.isValid) {
    console.log('\n✅ Environment configuration is valid!');
  } else {
    console.log('\n❌ Environment configuration has errors!');
    console.log('Please fix the errors above before starting the server.');
  }
  
  return validation.isValid;
}

/**
 * Initialize and validate environment on module load
 */
export function initializeEnvironment() {
  console.log('🚀 Initializing environment configuration...\n');
  
  // Check for .env file
  checkEnvFile();
  
  // Validate all variables
  const isValid = displayEnvironmentSummary();
  
  if (!isValid) {
    console.log('\n💡 Setup instructions:');
    console.log('1. Copy .env.example to .env if you haven\'t already');
    console.log('2. Fill in the required values (especially GEMINI_API_KEY)');
    console.log('3. Restart the server');
    
    process.exit(1);
  }
  
  console.log('\n🎉 Environment setup complete!\n');
  return getValidatedConfig();
}