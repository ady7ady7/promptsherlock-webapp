// backend/server.js - CORRECTED VERSION
/**
 * Enhanced server configuration for production deployment
 * Fixed to work with existing codebase structure
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables first
dotenv.config();

// Import routes
import analyzeRouter from './routes/analyze.js';

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

console.log('🚀 AI Image Analyzer Server Starting...');
console.log('═'.repeat(60));

// Simple environment validation
const requiredEnvVars = ['GEMINI_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('   Please set these in your Render dashboard environment section');
  process.exit(1);
}

console.log('✅ Required environment variables present');
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`);

// =============================================================================
// EXPRESS APP INITIALIZATION
// =============================================================================

const app = express();
const PORT = process.env.PORT || 10000;

// Trust proxy for Render
app.set('trust proxy', 1);

// =============================================================================
// SECURITY & MIDDLEWARE
// =============================================================================

// Compression
app.use(compression({
  level: 6,
  threshold: 1024
}));

// Security headers with production-safe settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for API server
  hsts: process.env.NODE_ENV === 'production'
}));

// =============================================================================
// ENHANCED CORS CONFIGURATION
// =============================================================================

const getCorsOptions = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  const nodeEnv = process.env.NODE_ENV;
  
  console.log('🔍 CORS Configuration:');
  console.log('   Frontend URL:', frontendUrl);
  console.log('   Environment:', nodeEnv);
  
  // Development origins
  const devOrigins = [
    'https://promptsherlock.ai',
    'https://www.promptsherlock.ai',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];
  
  // Production origins
  const prodOrigins = [];
  if (frontendUrl) {
    prodOrigins.push(frontendUrl);
    
    // Add common variations for Netlify
    if (frontendUrl.includes('netlify.app')) {
      const baseUrl = frontendUrl.replace('https://', '').replace('.netlify.app', '');
      prodOrigins.push(`https://deploy-preview-*--${baseUrl}.netlify.app`);
    }
  }
  
  const allowedOrigins = [
    ...devOrigins,
    ...prodOrigins
  ].filter(Boolean);
  
  console.log('   Allowed origins:', allowedOrigins);
  
  return {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        console.log('   ✅ No origin header - allowing request');
        return callback(null, true);
      }
      
      // Check exact matches
      if (allowedOrigins.includes(origin)) {
        console.log('   ✅ Origin allowed:', origin);
        return callback(null, true);
      }
      
      // Check Netlify deploy previews pattern
      const isNetlifyPreview = origin.includes('netlify.app') && 
                              frontendUrl && frontendUrl.includes('netlify.app');
      
      if (isNetlifyPreview) {
        console.log('   ✅ Netlify preview origin allowed:', origin);
        return callback(null, true);
      }
      
      // Development mode - be more permissive
      if (nodeEnv === 'development') {
        console.log('   ⚠️ Development mode - allowing origin:', origin);
        return callback(null, true);
      }
      
      console.log('   ❌ Origin blocked:', origin);
      console.log('   📋 Allowed origins:', allowedOrigins);
      
      const error = new Error('Not allowed by CORS');
      error.status = 403;
      callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials'
    ],
    maxAge: 86400, // Cache preflight for 24 hours
    optionsSuccessStatus: 200
  };
};

// Apply CORS configuration
const corsOptions = getCorsOptions();
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    skip: function (req, res) {
      return res.statusCode < 400;
    }
  }));
}

// Rate limiting (only for API routes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/'
});

// Body parsing
app.use(express.json({ 
  limit: '1mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb'
}));

// =============================================================================
// ROUTES
// =============================================================================

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    node: process.version,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    config: {
      aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
      maxFileSize: process.env.MAX_FILE_SIZE || '10485760',
      maxFiles: process.env.MAX_FILES || '10',
      rateLimitMax: '100',
      rateLimitWindow: '15min'
    }
  });
});

// Root endpoint with service info - THIS WAS MISSING!
app.get('/', (req, res) => {
  const uptime = process.uptime();
  
  res.json({
    service: 'AI Image Analyzer API',
    status: 'running',
    version: '1.0.0',
    description: 'Backend service for AI-powered image analysis',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    
    endpoints: {
      health: '/health',
      analyze: '/api/analyze',
      config: '/api/analyze/config'
    },
    
    deployment: {
      platform: 'Render',
      frontend: process.env.FRONTEND_URL || 'Not configured',
      cors: corsOptions.origin ? 'Configured' : 'Default'
    },
    
    documentation: {
      upload: {
        method: 'POST',
        url: '/api/analyze',
        contentType: 'multipart/form-data',
        fields: {
          images: 'File[] (1-10 images, max 10MB each)',
          prompt: 'string (optional custom analysis prompt)'
        }
      }
    }
  });
});

// Apply rate limiting to API routes only
app.use('/api', limiter);

// API routes
app.use('/api/analyze', analyzeRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.warn(`🔍 API endpoint not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: [
      'GET /health',
      'GET /',
      'POST /api/analyze',
      'GET /api/analyze/health',
      'GET /api/analyze/config'
    ]
  });
});

// CORS error handler
app.use((error, req, res, next) => {
  if (error.message === 'Not allowed by CORS') {
    console.error('❌ CORS Error:', {
      origin: req.get('Origin'),
      method: req.method,
      path: req.path,
      frontendUrl: process.env.FRONTEND_URL
    });
    
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      message: 'Your domain is not allowed to access this API',
      code: 'CORS_ERROR',
      debug: {
        requestOrigin: req.get('Origin'),
        allowedOrigin: process.env.FRONTEND_URL,
        suggestion: 'Ensure FRONTEND_URL environment variable matches your domain exactly'
      }
    });
  }
  
  next(error);
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  const status = error.status || error.statusCode || 500;
  
  const errorResponse = {
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }
  
  res.status(status).json(errorResponse);
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: 'The requested resource does not exist',
    path: req.originalUrl
  });
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

const gracefulShutdown = (signal) => {
  console.log(`\n👋 ${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('═'.repeat(60));
  console.log('🚀 AI IMAGE ANALYZER SERVER READY');
  console.log('═'.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'Not configured'}`);
  console.log(`🤖 AI Model: ${process.env.AI_MODEL || 'gemini-1.5-flash'}`);
  console.log(`⚡ Rate limiting: 100 requests per 15 minutes`);
  
  console.log('\n🌐 Available Endpoints:');
  console.log(`   • Health Check: http://localhost:${PORT}/health`);
  console.log(`   • Service Info: http://localhost:${PORT}/`);
  console.log(`   • Image Analysis: http://localhost:${PORT}/api/analyze`);
  console.log(`   • Service Config: http://localhost:${PORT}/api/analyze/config`);
  
  console.log('\n🔧 Environment Check:');
  console.log(`   • PORT: ${process.env.PORT || 'Using default (10000)'}`);
  console.log(`   • FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ NOT SET'}`);
  console.log(`   • GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   • NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  
  if (!process.env.FRONTEND_URL) {
    console.log('\n⚠️  WARNING: FRONTEND_URL not set!');
    console.log('   This will cause CORS errors in production.');
    console.log('   Set it to: https://prompt-sherlock.netlify.app');
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('\n⚠️  WARNING: GEMINI_API_KEY not set!');
    console.log('   Image analysis will fail without a valid API key.');
  }
  
  console.log('\n✅ Server ready to handle requests!');
  console.log('═'.repeat(60));
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

export default app;