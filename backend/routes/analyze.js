// backend/routes/analyze.js - ENHANCED VERSION
// Updated to work with existing frontend goal/engine names

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadMiddleware, validateUpload, cleanupFiles } from '../middleware/upload.js';
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();

// =============================================================================
// AI SERVICE INITIALIZATION
// =============================================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * ENHANCED PROMPT ENGINEERING SYSTEM
 * Works with existing frontend goal and engine naming conventions
 */
class PromptEngineering {
  
  /**
   * Map frontend goal names to backend processing
   */
  static mapGoalName(frontendGoal) {
    const goalMap = {
      'find_common_features': 'findFeatures',
      'copy_image': 'copyImage', 
      'copy_character': 'copyCharacter',
      'copy_style': 'copyStyle'
    };
    return goalMap[frontendGoal] || frontendGoal;
  }

  /**
   * Map frontend engine names to backend processing
   */
  static mapEngineName(frontendEngine) {
    const engineMap = {
      'stable_diffusion': 'stableDiffusion',
      'gemini_imagen': 'geminiImagen',
      'leonardo': 'leonardo'
    };
    return engineMap[frontendEngine] || frontendEngine;
  }

  /**
   * Core prompt templates based on analysis goals
   */
  static getBasePromptByGoal(goal, imageCount, customPrompt = '') {
    const templates = {
      'findFeatures': `Analyze ${imageCount === 1 ? 'this image' : `these ${imageCount} images`} and identify all key visual elements, features, and characteristics. Provide a comprehensive analysis focusing on:

• Visual composition and layout
• Colors, lighting, and atmosphere  
• Objects, subjects, and their positioning
• Style and artistic techniques
• Mood and emotional impact
• Technical aspects (if applicable)

${customPrompt ? `\nSpecial focus requested: ${customPrompt}` : ''}

Please provide clear, natural language descriptions without using markdown formatting symbols (no ###, ***, etc.). Write in flowing paragraphs that read naturally.`,

      'copyImage': `Create a detailed prompt that would allow someone to recreate or generate a very similar image ${imageCount > 1 ? 'to these images' : 'to this image'}. Focus on capturing:

• Exact visual style and artistic approach
• Composition and framing details  
• Color palette and lighting setup
• Subject positioning and proportions
• Environmental details and background
• Camera angle or artistic perspective
• Texture and material qualities

${customPrompt ? `\nAdditional requirements: ${customPrompt}` : ''}

Format this as a clear, detailed generation prompt without markdown symbols.`,

      'copyCharacter': `Analyze ${imageCount === 1 ? 'the character shown in this image' : `the characters shown in these ${imageCount} images`} and create a detailed character description prompt focusing on:

• Physical appearance and features
• Clothing style and accessories
• Pose, expression, and body language  
• Age, gender, and distinctive characteristics
• Hair style, color, and texture
• Facial features and expressions
• Overall style and artistic treatment

${customPrompt ? `\nSpecial character focus: ${customPrompt}` : ''}

Provide this as a natural, flowing description suitable for character generation.`,

      'copyStyle': `Analyze the artistic style ${imageCount === 1 ? 'of this image' : `across these ${imageCount} images`} and create a comprehensive style guide focusing on:

• Artistic technique and medium
• Color palette and color relationships
• Brushwork, texture, and surface treatment
• Composition and design principles
• Lighting approach and mood
• Level of detail and abstraction
• Cultural or artistic movement influences

${customPrompt ? `\nStyle-specific focus: ${customPrompt}` : ''}

Present this as a cohesive style description without technical formatting symbols.`
    };

    return templates[goal] || templates.findFeatures;
  }

  /**
   * Engine-specific prompt optimization (using your existing engine names)
   */
  static optimizeForEngine(baseAnalysis, engine, goal) {
    if (!engine || goal === 'findFeatures') {
      return baseAnalysis; // No engine optimization needed for feature analysis
    }

    const engineOptimizations = {
      'midjourney': {
        prefix: 'MIDJOURNEY OPTIMIZED PROMPT:\n\n',
        style: 'Format as a Midjourney prompt with descriptive keywords, style modifiers, and parameter suggestions. Focus on visual elements that work well with Midjourney\'s strengths.',
        suffix: '\n\nOptional Midjourney parameters to consider: --ar 16:9, --style, --chaos, --quality, --seed'
      },
      
      'dalle': {
        prefix: 'DALL-E 3 OPTIMIZED PROMPT:\n\n',
        style: 'Format as a DALL-E prompt emphasizing clear, descriptive language and specific visual details. Focus on photorealistic or artistic elements that DALL-E handles well.',
        suffix: '\n\nOptimized for DALL-E 3\'s natural language understanding and photorealistic capabilities.'
      },
      
      'stableDiffusion': {
        prefix: 'STABLE DIFFUSION OPTIMIZED PROMPT:\n\n',
        style: 'Format as a Stable Diffusion prompt with emphasis on keywords, artistic styles, and quality modifiers. Include both positive prompt elements and suggested negative prompts.',
        suffix: '\n\nSuggested negative prompt elements: blurry, low quality, distorted, watermark'
      },
      
      'geminiImagen': {
        prefix: 'GEMINI IMAGEN OPTIMIZED PROMPT:\n\n',
        style: 'Format as a Gemini Imagen prompt emphasizing natural language descriptions and photorealistic details. Focus on clear, conversational descriptions.',
        suffix: '\n\nOptimized for Gemini Imagen\'s natural language processing and high-quality image generation.'
      },
      
      'flux': {
        prefix: 'FLUX OPTIMIZED PROMPT:\n\n',
        style: 'Format as a Flux prompt with emphasis on artistic styles, creative concepts, and detailed visual descriptions. Focus on creative and artistic elements.',
        suffix: '\n\nOptimized for Flux\'s creative and artistic generation capabilities.'
      },

      'leonardo': {
        prefix: 'LEONARDO AI OPTIMIZED PROMPT:\n\n',
        style: 'Format as a Leonardo AI prompt with emphasis on professional quality and creative control. Focus on detailed descriptions suitable for professional content creation.',
        suffix: '\n\nOptimized for Leonardo AI\'s professional-grade generation and fine-tuned control.'
      }
    };

    const optimization = engineOptimizations[engine];
    if (!optimization) return baseAnalysis;

    return `${optimization.prefix}${baseAnalysis}\n\n${optimization.suffix}`;
  }

  /**
   * Main prompt generation method
   */
  static generatePrompt(goal, engine, imageCount, customPrompt = '') {
    const basePrompt = this.getBasePromptByGoal(goal, imageCount, customPrompt);
    const optimizedPrompt = this.optimizeForEngine(basePrompt, engine, goal);
    
    return optimizedPrompt;
  }
}

// =============================================================================
// IMAGE PROCESSING UTILITIES
// =============================================================================

/**
 * Convert image to base64 for AI processing
 */
async function convertImageToBase64(imagePath) {
  try {
    // Use Sharp to optimize image before sending to AI
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

/**
 * Process multiple images for AI analysis
 */
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
// MAIN ANALYSIS ENDPOINT (Enhanced to work with existing frontend)
// =============================================================================

/**
 * POST /api/analyze - Enhanced to work with existing GoalSelection and EngineSelection components
 */
router.post('/', uploadMiddleware, validateUpload, async (req, res) => {
  const startTime = Date.now();
  let uploadedFiles = [];

  try {
    // Extract request data (supporting both old and new parameter names)
    const {
      prompt: legacyPrompt = '',           // existing parameter name
      customAnalysisPrompt = '',           // new parameter name
      outputGoal = '',                     // new parameter name
      generationEngine = '',               // new parameter name
      selectedGoal = '',                   // from existing frontend
      selectedEngine = ''                  // from existing frontend
    } = req.body;

    uploadedFiles = req.files || [];

    // Use new parameters if available, fall back to existing ones
    const customPrompt = customAnalysisPrompt || legacyPrompt;
    const goal = PromptEngineering.mapGoalName(outputGoal || selectedGoal);
    const engine = PromptEngineering.mapEngineName(generationEngine || selectedEngine);

    console.log('🎯 Enhanced Analysis Request:', {
      imageCount: uploadedFiles.length,
      goal: goal,
      engine: engine,
      hasCustomPrompt: Boolean(customPrompt),
      customPromptLength: customPrompt.length
    });

    // If no goal specified, default to feature analysis
    const finalGoal = goal || 'findFeatures';

    // Validate goal
    const validGoals = ['findFeatures', 'copyImage', 'copyCharacter', 'copyStyle'];
    if (!validGoals.includes(finalGoal)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis goal',
        code: 'INVALID_GOAL',
        validGoals
      });
    }

    // Engine is required for generation goals, but not for findFeatures
    if (finalGoal !== 'findFeatures' && !engine) {
      return res.status(400).json({
        success: false,
        error: 'Generation engine required for prompt creation goals',
        code: 'ENGINE_REQUIRED',
        suggestion: 'Please select an AI generation engine for prompt optimization'
      });
    }

    // Process images for AI analysis
    const aiImages = await processImagesForAI(uploadedFiles);

    // Generate optimized prompt using our prompt engineering system
    const optimizedPrompt = PromptEngineering.generatePrompt(
      finalGoal,
      engine,
      uploadedFiles.length,
      customPrompt
    );

    console.log('🧠 Generated optimized prompt for', finalGoal, 'with', engine || 'no engine');

    // Prepare AI request
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const aiRequest = [
      optimizedPrompt,
      ...aiImages
    ];

    // Send to AI for analysis
    console.log('🤖 Sending request to Gemini AI...');
    const result = await model.generateContent(aiRequest);
    const analysisText = result.response.text();

    // Clean up analysis text (remove any markdown symbols for clean display)
    const cleanAnalysis = analysisText
      .replace(/#{1,6}\s*/g, '') // Remove heading markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // Remove bold/italic markers
      .replace(/`{1,3}([^`]+)`{1,3}/g, '$1') // Remove code markers
      .replace(/^\s*[-*+]\s*/gm, '') // Remove bullet points
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered lists
      .trim();

    const processingTime = Date.now() - startTime;

    console.log('✅ Analysis completed successfully:', {
      goal: finalGoal,
      engine: engine || 'none',
      imageCount: uploadedFiles.length,
      processingTime: `${processingTime}ms`,
      analysisLength: cleanAnalysis.length
    });

    // Return enhanced response (compatible with existing frontend)
    res.json({
      success: true,
      analysis: cleanAnalysis,
      
      // Enhanced metadata for new features
      metadata: {
        imageCount: uploadedFiles.length,
        outputGoal: finalGoal,
        generationEngine: engine,
        hasCustomPrompt: Boolean(customPrompt),
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        analysisLength: cleanAnalysis.length,
        optimizedFor: engine || 'general analysis'
      },

      // Legacy fields for existing frontend compatibility
      processedImages: uploadedFiles.length,
      goal: finalGoal,
      engine: engine
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ Enhanced analysis error:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      processingTime: `${processingTime}ms`,
      imageCount: uploadedFiles.length
    });

    // Determine error type and provide helpful message
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
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } finally {
    // Always clean up uploaded files for privacy
    await cleanupFiles(uploadedFiles);
  }
});

// =============================================================================
// UTILITY ENDPOINTS (Enhanced)
// =============================================================================

/**
 * GET /api/analyze/health - Service health check
 */
router.get('/health', async (req, res) => {
  try {
    // Test AI service connectivity
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const testResult = await model.generateContent('Test connection');
    
    res.json({
      status: 'healthy',
      service: 'Enhanced Image Analysis API',
      ai: {
        provider: 'Google Gemini',
        model: 'gemini-1.5-flash',
        status: testResult ? 'connected' : 'error'
      },
      features: {
        goals: ['find_common_features', 'copy_image', 'copy_character', 'copy_style'],
        engines: ['midjourney', 'dalle', 'stable_diffusion', 'gemini_imagen', 'flux', 'leonardo'],
        promptEngineering: true,
        batchProcessing: true,
        legacyCompatibility: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      error: 'AI service unavailable',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analyze/config - Enhanced service configuration
 */
router.get('/config', async (req, res) => {
  try {
    const { getUploadConfig } = await import('../middleware/upload.js');
    const config = getUploadConfig();
    
    res.json({
      success: true,
      service: 'Enhanced AI Image Analyzer',
      version: '2.0.0',
      config: {
        upload: {
          maxFileSize: config.maxFileSize,
          maxFileSizeMB: config.maxFileSizeMB,
          maxFiles: config.maxFiles,
          allowedTypes: config.allowedMimeTypes,
          allowedExtensions: config.allowedExtensions
        },
        analysis: {
          maxPromptLength: 2000,
          aiProvider: 'Google Gemini',
          model: 'gemini-1.5-flash',
          promptEngineering: true,
          legacySupport: true
        },
        goals: {
          find_common_features: 'Comprehensive visual analysis and feature identification',
          copy_image: 'Generate prompts to recreate similar images',
          copy_character: 'Create character-focused generation prompts',
          copy_style: 'Extract and describe artistic style elements'
        },
        engines: {
          midjourney: 'Optimized for Midjourney v6+ prompting style',
          dalle: 'Optimized for DALL-E 3 natural language prompts',
          stable_diffusion: 'Optimized for Stable Diffusion keyword-based prompts',
          gemini_imagen: 'Optimized for Gemini Imagen natural language',
          flux: 'Optimized for Flux creative and artistic generation',
          leonardo: 'Optimized for Leonardo AI professional content creation'
        },
        privacy: {
          dataRetention: 'none',
          immediateCleanup: true,
          secureProcessing: true,
          noTracking: true
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Config endpoint error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      details: 'Unable to retrieve current service configuration'
    });
  }
});

export default router;