// backend/server.js - FIXED VERSION FOR PRODUCTION
/**
 * Enhanced server configuration for production deployment
 * Fixes common issues with Render.com and Netlify integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import deployment configuration
import {
  getCorsOptions,
  configureServer,
  validateProductionConfig,
  getPort,
  productionErrorHandler,
  getRequestLogger
} from './config/deploy-config.js';

// Import routes
import analyzeRouter from './routes/analyze.js';

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

console.log('🚀 AI Image Analyzer Server Starting...');
console.log('═'.repeat(60));

try {
  const config = validateProductionConfig();
  console.log('✅ Configuration valid');
  console.log(`🌍 Environment: ${config.config.environment}`);
  console.log(`🔗 Frontend URL: ${config.config.frontendUrl}`);
  console.log(`🔑 Gemini API: ${config.config.geminiConfigured ? 'Configured' : 'Missing'}`);
  console.log(`📡 Port: ${config.config.port}`);
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}

// =============================================================================
// EXPRESS APP INITIALIZATION
// =============================================================================

const app = express();
const PORT = getPort();

// Configure basic server settings
configureServer(app);

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

// CORS with enhanced configuration
const corsOptions = getCorsOptions();
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Request logging
app.use(getRequestLogger());

// Rate limiting (only for API routes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/'
});

// Body parsing with increased limits for image uploads
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

// Apply rate limiting to API routes only
app.use('/api', limiter);

// API routes
app.use('/api/analyze', analyzeRouter);

// =============================================================================
// COMPREHENSIVE ERROR HANDLING
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
        suggestion: 'Ensure FRONTEND_URL environment variable matches your domain'
      }
    });
  }
  
  next(error);
});

// Global error handler
app.use(productionErrorHandler);

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
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
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
    console.log('   Set it to your Netlify domain (e.g., https://your-app.netlify.app)');
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('\n⚠️  WARNING: GEMINI_API_KEY not set!');
    console.log('   Image analysis will fail without a valid API key.');
  }
  
  console.log('\n✅ Server ready to handle requests!');
  console.log('═'.repeat(60));
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('💡 Try using a different port or kill the existing process');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

export default app;