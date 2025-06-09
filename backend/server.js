import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rootRouter from './routes/root.js';


// Import environment validation
import { initializeEnvironment, getValidatedConfig } from './utils/envValidation.js';

// Import routes
import analyzeRouter from './routes/analyze.js';

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// ENVIRONMENT INITIALIZATION AND VALIDATION
// =============================================================================

console.log('🚀 AI Image Analyzer Server Starting...\n');

// Initialize and validate environment configuration
const config = initializeEnvironment();

// Extract validated configuration
const {
  PORT,
  NODE_ENV,
  FRONTEND_URL,
  GEMINI_API_KEY,
  AI_MODEL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  TRUST_PROXY
} = config;

console.log('✅ Environment validation passed');
console.log('🔑 Gemini API Key configured:', GEMINI_API_KEY ? 'YES' : 'NO');
console.log('🤖 AI Model:', AI_MODEL);
console.log('🌍 Environment:', NODE_ENV);
console.log('🔗 Frontend URL:', FRONTEND_URL);

// =============================================================================
// EXPRESS APP INITIALIZATION
// =============================================================================

const app = express();

// Trust proxy if configured (required for rate limiting behind reverse proxy)
if (TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
  console.log('🔒 Proxy trust enabled');
}

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Compression middleware for better performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      FRONTEND_URL,                    // http://localhost:5173
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      // Add the backend URL for direct access during development
      `http://localhost:${PORT}`,      // http://localhost:5001
      `http://127.0.0.1:${PORT}`,      // http://127.0.0.1:5001
    ];
    
    // Add additional origins from environment if specified
    if (process.env.ALLOWED_ORIGINS) {
      const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',');
      allowedOrigins.push(...additionalOrigins);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('🚫 CORS blocked origin:', origin);
      console.log('🔍 Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  maxAge: 86400, // Cache preflight for 24 hours
  optionsSuccessStatus: 200 // For legacy browser support
};

// =============================================================================
// RATE LIMITING
// =============================================================================

const limiter = rateLimit({
  windowMs: parseInt(RATE_LIMIT_WINDOW_MS),
  max: parseInt(RATE_LIMIT_MAX),
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.round(parseInt(RATE_LIMIT_WINDOW_MS) / 1000 / 60) + ' minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.round(parseInt(RATE_LIMIT_WINDOW_MS) / 1000 / 60);
    console.warn('🚫 Rate limit exceeded for IP:', req.ip, 'User-Agent:', req.get('User-Agent'));
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: `${retryAfter} minutes`,
      code: 'RATE_LIMIT_EXCEEDED',
      details: `You have exceeded the limit of ${RATE_LIMIT_MAX} requests per ${retryAfter} minutes.`
    });
  },
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});

// Apply rate limiting to API routes only
app.use('/api', limiter);

// =============================================================================
// LOGGING MIDDLEWARE
// =============================================================================

// Configure Morgan logging based on environment
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else if (NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: function (req, res) {
      return res.statusCode < 400; // Only log errors in production
    }
  }));
} else {
  app.use(morgan('common'));
}

// =============================================================================
// BODY PARSING MIDDLEWARE
// =============================================================================

app.use(express.json({ 
  limit: '1mb',
  strict: true,
  type: 'application/json'
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb',
  parameterLimit: 1000,
  type: 'application/x-www-form-urlencoded'
}));

// =============================================================================
// API ROUTES
// =============================================================================

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    environment: NODE_ENV,
    version: '1.0.0',
    node: process.version,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    config: {
      aiModel: AI_MODEL,
      maxFileSize: config.MAX_FILE_SIZE,
      maxFiles: config.MAX_FILES,
      rateLimitMax: RATE_LIMIT_MAX,
      rateLimitWindow: `${Math.round(parseInt(RATE_LIMIT_WINDOW_MS) / 1000 / 60)}min`
    }
  });
});

// API routes
app.use('/api/analyze', analyzeRouter);

app.use('/', rootRouter);


// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.warn('🔍 API endpoint not found:', req.method, req.originalUrl);
  
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: [
      'GET /health',
      'POST /api/analyze',
      'GET /api/analyze/health',
      'GET /api/analyze/config'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  // Log error details
  console.error('🚨 Global error handler:', {
    message: error.message,
    stack: NODE_ENV === 'development' ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Determine error status
  const status = error.status || error.statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    success: false,
    error: NODE_ENV === 'development' ? error.message : 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };
  
  // Add stack trace in development
  if (NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = error.details || 'An unexpected error occurred';
  }
  
  res.status(status).json(errorResponse);
});

// =============================================================================
// GRACEFUL SHUTDOWN HANDLING
// =============================================================================

/**
 * Graceful shutdown handler
 */
function gracefulShutdown(signal) {
  console.log(`\n👋 ${signal} received, shutting down gracefully...`);
  
  // Give existing requests time to complete
  setTimeout(() => {
    console.log('🔄 Performing cleanup...');
    
    // Close database connections, cleanup files, etc.
    // Import cleanup utility if needed
    
    console.log('✅ Cleanup completed');
    process.exit(0);
  }, 5000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  
  // Attempt graceful shutdown
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);
  
  // Attempt graceful shutdown
  gracefulShutdown('unhandledRejection');
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const server = app.listen(PORT, () => {
  console.log('\n' + '═'.repeat(65));
  console.log('🚀 AI IMAGE ANALYZER SERVER READY');
  console.log('═'.repeat(65));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔗 CORS enabled for: ${FRONTEND_URL}`);
  console.log(`🤖 AI Model: ${AI_MODEL}`);
  console.log(`📁 Upload directory: ${config.UPLOAD_DIR}`);
  console.log(`⚡ Rate limiting: ${RATE_LIMIT_MAX} requests per ${Math.round(parseInt(RATE_LIMIT_WINDOW_MS) / 1000 / 60)} minutes`);
  console.log(`💾 Max file size: ${Math.round(parseInt(config.MAX_FILE_SIZE) / 1024 / 1024)}MB`);
  console.log(`📊 Max files per request: ${config.MAX_FILES}`);
  
  if (NODE_ENV === 'development') {
    console.log('\n🔧 Development Features:');
    console.log('   • Detailed error messages enabled');
    console.log('   • Request logging enabled');
    console.log('   • Hot reload supported');
  }
  
  if (NODE_ENV === 'production') {
    console.log('\n🔒 Production Security:');
    console.log('   • HTTPS enforcement enabled');
    console.log('   • Security headers configured');
    console.log('   • Error details hidden');
    console.log('   • Rate limiting active');
  }
  
  console.log('\n🌐 Available Endpoints:');
  console.log(`   • Health Check: http://localhost:${PORT}/health`);
  console.log(`   • Image Analysis: http://localhost:${PORT}/api/analyze`);
  console.log(`   • Service Config: http://localhost:${PORT}/api/analyze/config`);
  
  console.log('\n✅ Server ready to handle requests!');
  console.log('═'.repeat(65));
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('💡 Try using a different port:');
    console.log('   export PORT=3001 && npm start');
    console.log('   or update your .env file');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

export default app;