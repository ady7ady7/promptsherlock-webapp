import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs-extra';
import path from 'path';

// Initialize Gemini AI
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.AI_MODEL || 'gemini-1.5-flash';

if (!API_KEY) {
  console.error('⚠️  GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Convert file to Gemini-compatible format
 * 
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} - Gemini file format
 */
const fileToGenerativePart = async (file) => {
  try {
    const data = await fs.readFile(file.path);
    
    return {
      inlineData: {
        data: data.toString('base64'),
        mimeType: file.mimetype
      }
    };
  } catch (error) {
    console.error(`Error reading file ${file.filename}:`, error);
    throw new Error(`Failed to process file: ${file.originalname}`);
  }
};

/**
 * Analyze images using Gemini AI
 * 
 * @param {Array} files - Array of multer file objects
 * @param {string} prompt - Custom analysis prompt
 * @returns {Promise<string>} - AI analysis result
 */
export const analyzeImages = async (files, prompt = 'Analyze these images and provide detailed insights.') => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No images provided for analysis');
    }

    console.log(`Starting analysis of ${files.length} images with Gemini ${MODEL_NAME}`);

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Convert files to Gemini format
    const imageParts = await Promise.all(
      files.map(file => fileToGenerativePart(file))
    );

    // Enhance the prompt based on number of images
    let enhancedPrompt;
    if (files.length === 1) {
      enhancedPrompt = `${prompt}

Please provide a comprehensive analysis of this image including:
- What you see in the image (objects, people, scenes, etc.)
- Colors, composition, and visual style
- Any text or readable content
- Mood, atmosphere, or artistic elements
- Technical aspects if relevant (photography, design, etc.)
- Any interesting or notable details

Be detailed and specific in your analysis.`;
    } else {
      enhancedPrompt = `${prompt}

I'm providing ${files.length} images for analysis. Please:
- Analyze each image individually
- Identify common themes or connections between the images
- Compare and contrast the different images
- Provide insights about the collection as a whole
- Note any sequential or related content
- Summarize the overall narrative or purpose

Be comprehensive and provide detailed observations for each image as well as collective insights.`;
    }

    // Generate content with both text and images
    const result = await model.generateContent([enhancedPrompt, ...imageParts]);
    const response = await result.response;
    const analysis = response.text();

    if (!analysis || analysis.trim().length === 0) {
      throw new Error('AI service returned empty response');
    }

    console.log(`✓ Analysis completed successfully (${analysis.length} characters)`);
    return analysis;

  } catch (error) {
    console.error('AI analysis error:', error);

    // Handle specific Google AI errors
    if (error.message?.includes('API key')) {
      throw new Error('AI service authentication failed. Please check your API key.');
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('AI service rate limit exceeded. Please try again later.');
    } else if (error.message?.includes('safety') || error.message?.includes('blocked')) {
      throw new Error('Content was blocked by AI safety filters. Please try different images.');
    } else if (error.message?.includes('file size') || error.message?.includes('too large')) {
      throw new Error('One or more images are too large for AI processing.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error connecting to AI service. Please try again.');
    } else if (error.message?.includes('timeout')) {
      throw new Error('AI service timeout. Please try again with fewer or smaller images.');
    }

    // Re-throw known errors
    if (error.message.startsWith('No images provided') || 
        error.message.startsWith('Failed to process file')) {
      throw error;
    }

    // Generic error for unknown issues
    throw new Error('AI analysis failed. Please try again.');
  }
};

/**
 * Test AI service connectivity
 * 
 * @returns {Promise<Object>} - Service status
 */
export const testAIService = async () => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Simple test prompt
    const result = await model.generateContent('Say "Hello" if you can understand this message.');
    const response = await result.response;
    const text = response.text();

    return {
      status: 'connected',
      model: MODEL_NAME,
      response: text,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('AI service test failed:', error);
    
    return {
      status: 'error',
      model: MODEL_NAME,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get AI service information
 * 
 * @returns {Object} - Service configuration info
 */
export const getAIServiceInfo = () => {
  return {
    provider: 'Google Generative AI',
    model: MODEL_NAME,
    apiKeyConfigured: !!API_KEY,
    capabilities: [
      'Image analysis',
      'Multi-image comparison',
      'Text extraction from images',
      'Visual content description',
      'Artistic analysis'
    ],
    limits: {
      maxImagesPerRequest: 10,
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
      maxFileSize: '10MB per image'
    }
  };
};