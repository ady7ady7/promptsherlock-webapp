// backend/config/deploy-config.js
/**
 * Production Deployment Configuration
 * Handles Render.com specific deployment requirements
 */

import express from 'express';
import cors from 'cors';

/**
 * Enhanced CORS configuration for production deployment
 */
export const getCorsOptions = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  const nodeEnv = process.env.NODE_ENV;
  
  console.log('🔍 CORS Configuration:');
  console.log('   Frontend URL:', frontendUrl);
  console.log('   Environment:', nodeEnv);
  
  // Development origins
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];
  
  // Production origins
  const prodOrigins = [];
  if (frontendUrl) {
    prodOrigins.push(frontendUrl);
    
    // Add common variations
    if (frontendUrl.includes('netlify.app')) {
      // Add the deploy preview pattern
      const baseUrl = frontendUrl.replace('https://', '').replace('.netlify.app', '');
      prodOrigins.push(`https://deploy-preview-*--${baseUrl}.netlify.app`);
      prodOrigins.push(`https://*.${baseUrl}.netlify.app`);
    }
  }
  
  // Additional origins from environment
  const additionalOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : [];
  
  const allowedOrigins = [
    ...devOrigins,
    ...prodOrigins,
    ...additionalOrigins
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
      
      // Check pattern matches (for Netlify deploy previews)
      const isNetlifyPreview = origin.includes('netlify.app') && 
                              allowedOrigins.some(allowed => 
                                allowed.includes('deploy-preview') || 
                                allowed.includes('*.netlify.app')
                              );
      
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

/**
 * Enhanced server configuration for Render deployment
 */
export const configureServer = (app) => {
  // Trust proxy for Render
  app.set('trust proxy', 1);
  
  // Health check endpoint (must be early in middleware chain)
  app.get('/health', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      node: process.version,
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      },
      config: {
        port: process.env.PORT,
        frontendUrl: process.env.FRONTEND_URL,
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        corsEnabled: true
      }
    });
  });
  
  // Root endpoint with service info
  app.get('/', (req, res) => {
    res.status(200).json({
      service: 'ImageAnalyzer API',
      status: 'running',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        analyze: '/api/analyze',
        config: '/api/analyze/config'
      },
      deployment: {
        platform: 'Render',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
  });
  
  return app;
};

/**
 * Environment validation for production
 */
export const validateProductionConfig = () => {
  const required = [
    'GEMINI_API_KEY',
    'FRONTEND_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  const warnings = [];
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate FRONTEND_URL format
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl && !frontendUrl.startsWith('http')) {
    throw new Error('FRONTEND_URL must start with http:// or https://');
  }
  
  // Check for HTTPS in production
  if (process.env.NODE_ENV === 'production' && frontendUrl && !frontendUrl.startsWith('https://')) {
    warnings.push('FRONTEND_URL should use HTTPS in production');
  }
  
  // Validate Gemini API key format
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && !geminiKey.startsWith('AIza')) {
    warnings.push('GEMINI_API_KEY should start with "AIza"');
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  console.log('✅ Production configuration validated');
  
  return {
    valid: true,
    warnings,
    config: {
      frontendUrl,
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 10000,
      geminiConfigured: !!geminiKey
    }
  };
};

/**
 * Render-specific port configuration
 */
export const getPort = () => {
  // Render uses PORT environment variable
  const port = process.env.PORT || 10000;
  
  console.log('📡 Server port configuration:');
  console.log('   PORT env var:', process.env.PORT);
  console.log('   Using port:', port);
  
  return parseInt(port, 10);
};

/**
 * Error handler for production deployment
 */
export const productionErrorHandler = (error, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log error details
  console.error('🚨 Error:', {
    message: error.message,
    status: error.status || 500,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: isDevelopment ? error.stack : undefined
  });
  
  // Determine error status
  const status = error.status || error.statusCode || 500;
  
  // Handle CORS errors specifically
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      message: 'Your domain is not allowed to access this API',
      code: 'CORS_ERROR',
      origin: req.get('Origin'),
      allowedOrigins: process.env.FRONTEND_URL || 'Not configured'
    });
  }
  
  // Generic error response
  const errorResponse = {
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };
  
  // Add debug info in development
  if (isDevelopment) {
    errorResponse.stack = error.stack;
    errorResponse.details = error.details;
  }
  
  res.status(status).json(errorResponse);
};

/**
 * Request logging for production
 */
export const getRequestLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return (req, res, next) => {
      console.log(`🔄 ${req.method} ${req.path}`, {
        origin: req.get('Origin'),
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type')
      });
      next();
    };
  }
  
  // Production: only log errors and important events
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Log errors and slow requests
      if (res.statusCode >= 400 || duration > 5000) {
        console.log(`${res.statusCode >= 400 ? '❌' : '⚠️'} ${req.method} ${req.path}`, {
          status: res.statusCode,
          duration: `${duration}ms`,
          origin: req.get('Origin'),
          ip: req.ip
        });
      }
    });
    
    next();
  };
};