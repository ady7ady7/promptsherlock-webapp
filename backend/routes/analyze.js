// backend/routes/analyze.js - MINIMAL UPDATE - ONLY ADDING FIRESTORE LIMITS
// KEEPING ALL YOUR EXISTING CODE, JUST REPLACING THE HARDCODED LIMIT

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import uploadMiddleware from '../middleware/upload.js';
import { cleanupFiles } from '../utils/cleanup.js';
import sharp from 'sharp';
import promptLoader from '../utils/promptLoader.js';

// Firebase Admin SDK imports
import { db, admin } from '../server.js';
import verifyFirebaseToken from '../middleware/auth.js';

// NEW: Import the config service
import { firestoreConfigService } from '../services/firestoreConfigService.js';

const router = express.Router();

// =============================================================================
// AI SERVICE INITIALIZATION
// =============================================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =============================================================================
// IMAGE PROCESSING UTILITIES
// =============================================================================

async function convertImageToBase64(imagePath) {
  try {
    const optimizedBuffer = await sharp(imagePath)
      .resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    return optimizedBuffer.toString('base64');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image for analysis');
  }
}

async function processImagesForAI(imageFiles) {
  const processedImages = [];

  for (const file of imageFiles) {
    try {
      const base64Data = await convertImageToBase64(file.path);
      processedImages.push({
        inlineData: {
          data: base64Data,
          mimeType: file.mimetype
        }
      });
    } catch (error) {
      console.error(`Error processing ${file.filename}:`, error);
      throw new Error(`Failed to process image: ${file.filename}`);
    }
  }

  return processedImages;
}

// =============================================================================
// CLEAN OUTPUT PROCESSOR
// =============================================================================

/**
 * Clean AI output to remove ALL markdown and formatting
 * Returns ONLY the final prompt/analysis
 */
function cleanFinalOutput(text) {
  return text
    // Remove ALL markdown headers
    .replace(/#{1,6}\s*[^#\n]*\*\*[^*]*\*\*[^#\n]*/g, '')
    .replace(/#{1,6}\s*/g, '')

    // Remove ALL bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')

    // Remove ALL code blocks and inline code
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')

    // Remove ALL bullet points and list markers
    .replace(/^\s*[-*+•]\s*/gm, '')
    .replace(/^\s*\d+\.\s*/gm, '')

    // Remove ALL emoji headers and special markers
    .replace(/🔍|🎨|🏞️|🔧|📝|💭|⭐|🔗|🎯|📋|✨/g, '')

    // Remove section labels and special formatting
    .replace(/Visual Description:|Composition & Aesthetics:|Context & Environment:|Technical Analysis:|Text & Readable Content:|Interpretation & Insights:|Notable Features:|Multi-Image Analysis|Special Focus Area:|DALL-E 3 Prompt|Midjourney Prompt|Stable Diffusion Prompt/gi, '')

    // Clean up extra whitespace and line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

// =============================================================================
// MAIN ANALYSIS ENDPOINT
// =============================================================================

router.post('/',
  verifyFirebaseToken,
  uploadMiddleware(),
  async (req, res) => {
    const startTime = Date.now();
    let uploadedFiles = [];

    try {
      const { user } = req;
      const {
        prompt = '',
        goal = 'copy_image',
        engine = ''
      } = req.body;

      uploadedFiles = req.files || [];

      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No images provided',
          code: 'NO_IMAGES'
        });
      }

      console.log('🎯 Analysis Request:', {
        imageCount: uploadedFiles.length,
        goal: goal,
        engine: engine,
        hasCustomPrompt: Boolean(prompt),
        userId: user.uid,
        isAnonymous: user.firebase.sign_in_provider === 'anonymous'
      });

      // 1. GET USER DATA FROM FIRESTORE AND CHECK LIMITS
      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // This shouldn't happen if AuthProvider on frontend works correctly,
        // but we add it just in case to avoid errors
        console.warn(`No user document for UID: ${user.uid}. Creating new one.`);
        await userRef.set({
          usageCount: 0,
          isPro: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      let userData = userDoc.data() || { usageCount: 0, isPro: false };

      // NEW: GET DYNAMIC LIMIT FROM FIRESTORE INSTEAD OF HARDCODED
      const config = await firestoreConfigService.getConfig();
      const ANONYMOUS_LIMIT = config.anonymousLimit || 3; // Fallback to 3 if not set

      console.log(`📊 Using anonymous limit from Firestore: ${ANONYMOUS_LIMIT}`);

      // Check if user is anonymous and has exceeded limit
      if (user.firebase.sign_in_provider === 'anonymous' && !userData.isPro) {
        if (userData.usageCount >= ANONYMOUS_LIMIT) {
          console.log(`Anonymous user ${user.uid} exceeded limit (${userData.usageCount}/${ANONYMOUS_LIMIT}).`);
          return res.status(403).json({
            success: false,
            error: `You have reached the limit of ${ANONYMOUS_LIMIT} uses for anonymous users. Please sign in to continue.`,
            code: 'USAGE_LIMIT_EXCEEDED'
          });
        }
      }

      // Validate goal - only copy_image and copy_style
      const validGoals = ['copy_image', 'copy_style'];
      if (!validGoals.includes(goal)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid analysis goal',
          code: 'INVALID_GOAL',
          validGoals
        });
      }

      // Both remaining goals require engine selection
      if (!engine) {
        return res.status(400).json({
          success: false,
          error: 'Generation engine required for prompt creation goals',
          code: 'ENGINE_REQUIRED'
        });
      }

      const validEngines = ['midjourney', 'dalle', 'stable_diffusion', 'gemini_imagen', 'flux', 'leonardo'];
      if (!validEngines.includes(engine)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid generation engine',
          code: 'INVALID_ENGINE',
          validEngines
        });
      }

      // Process images for AI analysis
      const processedImages = await processImagesForAI(uploadedFiles);
      console.log(`📸 Successfully processed ${processedImages.length} images`);

      // Get the appropriate prompt
      const analysisPrompt = promptLoader.getPrompt(goal, engine);
      const finalPrompt = prompt ? `${analysisPrompt}\n\nAdditional focus: ${prompt}` : analysisPrompt;

      console.log(`📝 Using prompt for ${goal}/${engine}`);

      // Prepare content for Gemini
      const content = [finalPrompt, ...processedImages];

      // Call Gemini API
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      console.log('🤖 Sending request to Gemini API...');
      const result = await model.generateContent(content);
      const response = await result.response;
      const rawAnalysis = response.text();

      // Clean the output to remove all formatting
      const cleanedAnalysis = cleanFinalOutput(rawAnalysis);

      const processingTime = Date.now() - startTime;

      console.log('✅ Analysis completed successfully:', {
        processingTime: `${processingTime}ms`,
        rawLength: rawAnalysis.length,
        cleanedLength: cleanedAnalysis.length,
        goal: goal,
        engine: engine
      });

      // 2. INCREMENT USAGE COUNTER IN FIRESTORE (ONLY IF ANALYSIS SUCCEEDED)
      await userRef.update({ usageCount: admin.firestore.FieldValue.increment(1) });
      console.log(`Usage counter for user ${user.uid} incremented to ${userData.usageCount + 1}.`);

      // Return successful response
      res.json({
        success: true,
        analysis: cleanedAnalysis,
        metadata: {
          goal: goal,
          engine: engine,
          imageCount: uploadedFiles.length,
          processingTime: processingTime,
          hasCustomPrompt: Boolean(prompt),
          output_type: 'prompt', // Both functions generate prompts
          user_id: user.uid,
          is_anonymous: user.firebase.sign_in_provider === 'anonymous',
          current_usage: userData.usageCount + 1,
          limit: userData.isPro ? 'unlimited' : ANONYMOUS_LIMIT
        }
      });

    } catch (error) {
      console.error('❌ Analysis Error:', error);

      let errorResponse = {
        success: false,
        error: 'Analysis failed',
        code: 'ANALYSIS_ERROR'
      };

      // Handle authentication middleware errors (e.g. 401)
      // Important: Check if response has already been sent by previous middleware
      if (res.headersSent) {
        return; // If so, just end to avoid "Cannot set headers after they are sent to the client" error
      }

      // Handle specific error types
      if (error.constructor.name === 'MulterError') {
        if (error.code === 'LIMIT_FILE_SIZE') {
          errorResponse = {
            success: false,
            error: 'One or more files are too large. Maximum size is 10MB.',
            code: 'FILE_SIZE_LIMIT_EXCEEDED'
          };
          return res.status(413).json(errorResponse);
        }
        errorResponse = {
          success: false,
          error: `File upload error: ${error.message}`,
          code: 'UPLOAD_ERROR'
        };
        return res.status(400).json(errorResponse);
      }
      else if (error.message?.includes('API key')) {
        errorResponse = {
          success: false,
          error: 'AI service configuration error',
          code: 'API_KEY_ERROR'
        };
      } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        errorResponse = {
          success: false,
          error: 'AI service rate limit reached. Please try again later.',
          code: 'AI_RATE_LIMIT_ERROR'
        };
      } else if (error.message?.includes('timeout')) {
        errorResponse = {
          success: false,
          error: 'Analysis request timed out. Please try with smaller images.',
          code: 'TIMEOUT_ERROR'
        };
      } else if (error.message?.includes('Failed to process image')) {
        errorResponse = {
          success: false,
          error: error.message,
          code: 'IMAGE_PROCESSING_ERROR'
        };
      }

      res.status(500).json(errorResponse);

    } finally {
      // CRITICAL: Always clean up uploaded files
      if (uploadedFiles && uploadedFiles.length > 0) {
        await cleanupFiles(uploadedFiles);
      }
    }
  }
);

// =============================================================================
// HEALTH CHECK ENDPOINTS
// =============================================================================

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Image Analysis API',
    message: 'Service is running normally',
    availableGoals: ['copy_image', 'copy_style'],
    availableEngines: ['midjourney', 'dalle', 'stable_diffusion', 'gemini_imagen', 'flux', 'leonardo']
  });
});

// NEW: Enhanced config endpoint that shows Firestore limits
router.get('/config', async (req, res) => {
  try {
    // Get current limits from Firestore
    const firestoreConfig = await firestoreConfigService.getConfig();
    
    res.json({
      service: 'Image Analysis API',
      version: '1.0.0',

      limits: {
        maxFiles: 10,
        maxFileSize: '10MB',
        supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
        anonymousLimit: firestoreConfig.anonymousLimit || 3, // Now shows Firestore value
        tiers: firestoreConfig.tiers || {} // Show tier limits from Firestore
      },

      goals: [
        {
          id: 'copy_image',
          name: 'Copy Image',
          description: 'Generate prompts to recreate images',
          requiresEngine: true
        },
        {
          id: 'copy_style',
          name: 'Copy Style',
          description: 'Extract and describe artistic styles',
          requiresEngine: true
        }
      ],

      engines: [
        { id: 'midjourney', name: 'Midjourney' },
        { id: 'dalle', name: 'DALL-E 3' },
        { id: 'stable_diffusion', name: 'Stable Diffusion' },
        { id: 'gemini_imagen', name: 'Gemini Imagen' },
        { id: 'flux', name: 'Flux' },
        { id: 'leonardo', name: 'Leonardo AI' }
      ],

      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'Not configured',
        aiModel: 'gemini-1.5-flash',
        promptsLoaded: Object.keys(promptLoader.getAllPrompts()).length,
        firestoreConfigLoaded: !!firestoreConfig // Shows if Firestore config is working
      }
    });
  } catch (error) {
    console.error('❌ Error getting config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      code: 'CONFIG_ERROR'
    });
  }
});

// NEW: Simple endpoint to get current usage stats (for monitoring)
router.get('/usage-stats', async (req, res) => {
  try {
    const summary = await firestoreConfigService.getUsageSummary();
    res.json({
      success: true,
      stats: summary
    });
  } catch (error) {
    console.error('❌ Error getting usage stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage statistics',
      code: 'STATS_ERROR'
    });
  }
});

// NEW: Simple real-time usage counter endpoint (for frontend)
router.get('/live-stats', async (req, res) => {
  try {
    // Get real-time stats directly from Firestore (no caching)
    const usersSnapshot = await db.collection('users').get();
    
    let totalAnalyses = 0;
    let activeUsers = 0;
    let totalUsers = 0;
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      totalUsers++;
      totalAnalyses += data.usageCount || 0;
      
      // Count users who used the app in last 24h
      if (data.lastLogin && data.lastLogin.toDate() > yesterday) {
        activeUsers++;
      }
    });

    res.json({
      success: true,
      stats: {
        totalAnalyses,
        totalUsers,
        activeUsers,
        timestamp: now.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error getting live stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get live statistics',
      code: 'LIVE_STATS_ERROR'
    });
  }
});

export default router;