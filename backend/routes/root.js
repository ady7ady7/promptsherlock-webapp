import express from 'express';

const router = express.Router();

/**
 * GET / - Root route with API information
 * Provides information about the ImageAnalyzer API
 */
router.get('/', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    service: 'ImageAnalyzer API',
    status: 'running',
    version: '1.0.0',
    description: 'AI-powered image analysis backend service',
    
    // API Information
    endpoints: {
      health: '/health',
      analyze: '/api/analyze',
      config: '/api/analyze/config'
    },
    
    // Service Status
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    
    // System Info
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    },
    
    // Usage Info
    usage: {
      maxFileSize: '10MB per image',
      maxFiles: '10 images per request',
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
      aiModel: process.env.AI_MODEL || 'gemini-1.5-flash'
    },
    
    // Frontend URL
    frontend: process.env.FRONTEND_URL || 'Not configured',
    
    // Documentation
    documentation: {
      example: {
        method: 'POST',
        url: '/api/analyze',
        contentType: 'multipart/form-data',
        body: {
          images: 'File[] (1-10 images)',
          prompt: 'string (optional custom analysis prompt)'
        }
      }
    }
  });
});

/**
 * GET /api - API information route
 */
router.get('/api', (req, res) => {
  res.json({
    name: 'ImageAnalyzer API',
    version: '1.0.0',
    description: 'AI-powered image analysis service',
    endpoints: [
      {
        path: '/api/analyze',
        method: 'POST',
        description: 'Analyze uploaded images with AI',
        parameters: {
          images: 'multipart/form-data - Array of image files (max 10)',
          prompt: 'string - Optional custom analysis prompt (max 1000 chars)'
        }
      },
      {
        path: '/api/analyze/health',
        method: 'GET',
        description: 'Check analysis service health'
      },
      {
        path: '/api/analyze/config',
        method: 'GET',
        description: 'Get service configuration'
      },
      {
        path: '/health',
        method: 'GET',
        description: 'Check overall service health'
      }
    ]
  });
});

export default router;