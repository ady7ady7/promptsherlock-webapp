// backend/routes/analyze.js - CORRECTED VERSION - WORKING
// Fixed all import issues and timeout problems
// UPDATED: Removed find_common_features and copy_character references

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import uploadMiddleware from '../middleware/upload.js'; // CORRECT: default import
import { cleanupFiles } from '../utils/cleanup.js';
import sharp from 'sharp';
import promptLoader from '../utils/promptLoader.js';

// Importy dla Firebase Admin SDK
import { db, admin } from '../server.js'; // <-- DODANA LINIA: Importuj db i admin z server.js
import verifyFirebaseToken from '../middleware/auth.js'; // <-- DODANA LINIA: Importuj middleware uwierzytelniania

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
// MAIN ANALYSIS ENDPOINT - UPDATED: Only copy_image and copy_style
// =============================================================================

router.post('/',
  verifyFirebaseToken, // <-- DODANA LINIA: Użyj middleware do weryfikacji tokena (przed uploadem)
  uploadMiddleware(),
  async (req, res) => {
    const startTime = Date.now();
    let uploadedFiles = [];

    try {
      const { user } = req; // <-- DODANA LINIA: Dane użytkownika zdekodowane z tokena
      const {
        prompt = '',
        goal = 'copy_image', // UPDATED: Default to copy_image instead of find_common_features
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
        userId: user.uid, // <-- DODANY LOG
        isAnonymous: user.firebase.sign_in_provider === 'anonymous' // <-- DODANY LOG
      });

      // 1. POBIERZ DANE UŻYTKOWNIKA Z FIRESTORE I SPRAWDŹ LIMITY
      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // To nie powinno się zdarzyć, jeśli AuthProvider na frontendzie działa poprawnie,
        // ale dodajemy na wszelki wypadek, aby uniknąć błędów.
        console.warn(`Brak dokumentu użytkownika dla UID: ${user.uid}. Tworzenie nowego.`);
        await userRef.set({
          usageCount: 0,
          isPro: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      let userData = userDoc.data();
      const ANONYMOUS_LIMIT = 5; // Limit użyć dla użytkowników anonimowych

      // Sprawdź, czy użytkownik jest anonimowy i czy przekroczył limit
      if (user.firebase.sign_in_provider === 'anonymous' && !userData.isPro) {
        if (userData.usageCount >= ANONYMOUS_LIMIT) {
          console.log(`Użytkownik anonimowy ${user.uid} przekroczył limit (${userData.usageCount}/${ANONYMOUS_LIMIT}).`);
          return res.status(403).json({
            success: false, // <-- DODANA LINIA
            error: `Osiągnięto limit ${ANONYMOUS_LIMIT} użyć dla użytkowników anonimowych. Zaloguj się, aby kontynuować.`,
            code: 'USAGE_LIMIT_EXCEEDED' // <-- DODANA LINIA
          });
        }
      }

      // UPDATED: Validate goal - only copy_image and copy_style
      const validGoals = ['copy_image', 'copy_style'];
      if (!validGoals.includes(goal)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid analysis goal',
          code: 'INVALID_GOAL',
          validGoals
        });
      }

      // UPDATED: Both remaining goals require engine selection
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

      // 3. ZWIĘKSZ LICZNIK UŻYCIA W FIRESTORE (TYLKO JEŚLI ANALIZA SIĘ POWIODŁA)
      await userRef.update({ usageCount: admin.firestore.FieldValue.increment(1) });
      console.log(`Licznik użycia dla użytkownika ${user.uid} zwiększony do ${userData.usageCount + 1}.`);


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
          user_id: user.uid, // <-- DODANA LINIA
          is_anonymous: user.firebase.sign_in_provider === 'anonymous', // <-- DODANA LINIA
          current_usage: userData.usageCount + 1, // <-- DODANA LINIA
          limit: userData.isPro ? 'unlimited' : ANONYMOUS_LIMIT // <-- DODANA LINIA
        }
      });

    } catch (error) {
      console.error('❌ Analysis Error:', error);

      let errorResponse = {
        success: false,
        error: 'Analysis failed',
        code: 'ANALYSIS_ERROR'
      };

      // Obsługa błędów z middleware uwierzytelniania (np. 401)
      // Ważne: Sprawdź, czy odpowiedź już nie została wysłana przez poprzednie middleware
      if (res.headersSent) {
        return; // Jeśli tak, po prostu zakończ, aby uniknąć błędu "Cannot set headers after they are sent to the client"
      }

      // Handle specific error types
      if (error instanceof multer.MulterError) { // <-- Obsługa błędów Multer
        if (error.code === 'LIMIT_FILE_SIZE') {
          errorResponse = {
            success: false,
            error: 'Jeden lub więcej plików jest zbyt duży. Maksymalny rozmiar to 10MB.',
            code: 'FILE_SIZE_LIMIT_EXCEEDED'
          };
          return res.status(413).json(errorResponse);
        }
        errorResponse = {
          success: false,
          error: `Błąd przesyłania pliku: ${error.message}`,
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
    availableGoals: ['copy_image', 'copy_style'], // UPDATED: Only 2 goals
    availableEngines: ['midjourney', 'dalle', 'stable_diffusion', 'gemini_imagen', 'flux', 'leonardo']
  });
});

router.get('/config', (req, res) => {
  res.json({
    service: 'Image Analysis API',
    version: '1.0.0',

    limits: {
      maxFiles: 10,
      maxFileSize: '10MB',
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP']
    },

    // UPDATED: Only 2 goals now
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
      promptsLoaded: Object.keys(promptLoader.getAllPrompts()).length
    }
  });
});

export default router;
