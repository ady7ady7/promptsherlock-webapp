import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load environment variables based on NODE_ENV
 */
export function loadEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Load base .env file
  dotenv.config({ path: join(__dirname, '..', '.env') });
  
  // Load environment-specific .env file if it exists
  const envFile = join(__dirname, '..', `.env.${nodeEnv}`);
  dotenv.config({ path: envFile });
  
  console.log(`🌍 Environment: ${nodeEnv}`);
  console.log(`📁 Config loaded from: .env and .env.${nodeEnv}`);
  
  return {
    NODE_ENV: nodeEnv,
    PORT: process.env.PORT || 5000,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL,
    // Add other env vars as needed
  };
}

/**
 * Validate required environment variables
 */
export function validateEnvironment() {
  const required = [
    'GEMINI_API_KEY',
    'FRONTEND_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables present');
}