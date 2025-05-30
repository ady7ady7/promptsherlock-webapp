import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

console.log('Testing environment variable loading...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
console.log(`Looking for .env file at: ${envPath}`);
console.log(`File exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n.env file content:');
  console.log('--- START .env ---');
  console.log(envContent);
  console.log('--- END .env ---\n');
}

// Load environment variables
console.log('Loading dotenv...');
const result = dotenv.config();

if (result.error) {
  console.error('Dotenv error:', result.error);
} else {
  console.log('Dotenv loaded successfully');
}

// Check environment variables
console.log('\nEnvironment variables:');
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'NOT SET'}`);
console.log(`PORT: ${process.env.PORT || 'NOT SET'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);

// Show first and last few characters of API key for verification
if (process.env.GEMINI_API_KEY) {
  const key = process.env.GEMINI_API_KEY;
  const masked = key.substring(0, 4) + '...' + key.substring(key.length - 4);
  console.log(`API Key preview: ${masked}`);
}