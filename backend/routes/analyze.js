// backend/routes/analyze.js - FINAL CLEAN VERSION
// Returns ONLY the final prompt/analysis - no markdown, no verbose explanations

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadMiddleware, validateUpload, cleanupFiles } from '../middleware/upload.js';
import sharp from 'sharp';
import promptLoader from '../utils/promptLoader.js';

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

router.post('/', uploadMiddleware, validateUpload, async (req, res) => {
  const startTime = Date.now();
  let uploadedFiles = [];

  try {
    const {
      prompt = '',
      goal = 'find_common_features',
      engine = ''
    } = req.body;

    uploadedFiles = req.files || [];

    console.log('🎯 Analysis Request:', {
      imageCount: uploadedFiles.length,
      goal: goal,
      engine: engine,
      hasCustomPrompt: Boolean(prompt)
    });

    // Validate goal
    const validGoals = ['find_common_features', 'copy_image', 'copy_character', 'copy_style'];
    if (!validGoals.includes(goal)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis goal',
        code: 'INVALID_GOAL',
        validGoals
      });
    }

    // Engine validation for generation goals
    if (goal !== 'find_common_features' && !engine) {
      return res.status(400).json({
        success: false,
        error: 'Generation engine required for prompt creation goals',
        code: 'ENGINE_REQUIRED'
      });
    }

    const validEngines = ['midjourney', 'dalle', 'stable_diffusion', 'gemini_imagen', 'flux', 'leonardo'];
    if (engine && !validEngines.includes(engine)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generation engine',
        code: 'INVALID_ENGINE',
        validEngines
      });
    }

    // Process images for AI analysis
    const aiImages = await processImagesForAI(uploadedFiles);

    // Get clean prompt from prompts.env
    const basePrompt = promptLoader.getPrompt(goal, engine);
    const finalPrompt = promptLoader.addCustomInstructions(basePrompt, prompt);

    console.log('🧠 Using prompt template for', goal, 'with', engine || 'no engine');

    // Prepare AI request
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const aiRequest = [finalPrompt, ...aiImages];

    // Get AI response
    console.log('🤖 Sending request to Gemini AI...');
    const result = await model.generateContent(aiRequest);
    const rawAnalysis = result.response.text();

    // Clean the output - REMOVE ALL FORMATTING
    const cleanAnalysis = cleanFinalOutput(rawAnalysis);

    const processingTime = Date.now() - startTime;

    console.log('✅ Clean analysis completed:', {
      goal: goal,
      engine: engine || 'none',
      imageCount: uploadedFiles.length,
      processingTime: `${processingTime}ms`,
      outputLength: cleanAnalysis.length,
      isClean: !cleanAnalysis.includes('###') && !cleanAnalysis.includes('**')
    });

    // Return clean response
    res.json({
      success: true,
      analysis: cleanAnalysis,
      
      metadata: {
        image_count: uploadedFiles.length,
        goal: goal,
        engine: engine,
        has_custom_prompt: Boolean(prompt),
        processing_time: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        analysis_length: cleanAnalysis.length,
        optimized_for: engine || 'general analysis',
        output_type: goal === 'find_common_features' ? 'analysis' : 'prompt'
      },

      // Legacy compatibility
      processedImages: uploadedFiles.length,
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ Analysis error:', {
      message: error.message,
      processingTime: `${processingTime}ms`,
      imageCount: uploadedFiles.length
    });

    let errorMessage = 'Analysis failed';
    let errorCode = 'ANALYSIS_FAILED';

    if (error.message.includes('API key')) {
      errorMessage = 'AI service configuration error';
      errorCode = 'API_KEY_ERROR';
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      errorMessage = 'Service temporarily unavailable due to high demand';
      errorCode = 'RATE_LIMIT_ERROR';
    } else if (error.message.includes('image')) {
      errorMessage = 'Failed to process uploaded images';
      errorCode = 'IMAGE_PROCESSING_ERROR';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      metadata: {
        processing_time: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } finally {
    await cleanupFiles(uploadedFiles);
  }
});

// =============================================================================
// UTILITY ENDPOINTS
// =============================================================================

router.get('/health', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const testResult = await model.generateContent('Test connection');
    
    res.json({
      status: 'healthy',
      service: 'Clean Image Analysis API',
      ai: {
        provider: 'Google Gemini',
        model: 'gemini-1.5-flash',
        status: testResult ? 'connected' : 'error'
      },
      features: {
        goals: ['find_common_features', 'copy_image', 'copy_character', 'copy_style'],
        engines: ['midjourney', 'dalle', 'stable_diffusion', 'gemini_imagen', 'flux', 'leonardo'],
        clean_output: true,
        external_prompts: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'AI service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/config', async (req, res) => {
  try {
    const { getUploadConfig } = await import('../middleware/upload.js');
    const config = getUploadConfig();
    
    res.json({
      success: true,
      service: 'Clean AI Image Analyzer',
      version: '3.0.0',
      config: {
        upload: {
          max_file_size: config.maxFileSize,
          max_file_size_mb: config.maxFileSizeMB,
          max_files: config.maxFiles,
          allowed_types: config.allowedMimeTypes,
          allowed_extensions: config.allowedExtensions
        },
        analysis: {
          max_prompt_length: 2000,
          ai_provider: 'Google Gemini',
          model: 'gemini-1.5-flash',
          clean_output: true,
          external_prompts: true
        },
        goals: {
          find_common_features: 'Clean visual analysis without formatting',
          copy_image: 'Engine-optimized recreation prompts',
          copy_character: 'Character-focused generation prompts', 
          copy_style: 'Style extraction and replication prompts'
        },
        engines: {
          midjourney: 'Optimized for Midjourney v6+ prompting',
          dalle: 'Optimized for DALL-E 3 natural language',
          stable_diffusion: 'Optimized for Stable Diffusion keywords',
          gemini_imagen: 'Optimized for Gemini Imagen natural language',
          flux: 'Optimized for Flux creative generation',
          leonardo: 'Optimized for Leonardo AI professional content'
        },
        privacy: {
          data_retention: 'none',
          immediate_cleanup: true,
          secure_processing: true,
          no_tracking: true
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Config endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration'
    });
  }
});

// Endpoint to reload prompts (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/reload-prompts', (req, res) => {
    promptLoader.reload();
    res.json({
      success: true,
      message: 'Prompts reloaded from prompts.env',
      timestamp: new Date().toISOString()
    });
  });
}

export default router;