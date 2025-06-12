// backend/utils/promptLoader.js
// Updated to work with Render Secret Files

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PromptLoader {
  constructor() {
    this.prompts = {};
    this.loadPrompts();
  }

  loadPrompts() {
    try {
      // PRODUCTION: Try Render Secret Files first
      if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
        console.log('🔒 Loading prompts from Render Secret Files (production)');
        if (this.loadFromRenderSecretFiles()) {
          return;
        }
        console.log('⚠️ Render Secret Files not found, trying environment variables');
        this.loadFromEnvironment();
        return;
      }

      // DEVELOPMENT: Try local prompts.env file
      const promptsPath = path.join(__dirname, '../../prompts.env');
      
      if (fs.existsSync(promptsPath)) {
        console.log('📝 Loading prompts from local prompts.env file (development)');
        const content = fs.readFileSync(promptsPath, 'utf8');
        this.parsePromptsContent(content);
      } else {
        console.warn('⚠️ Local prompts.env file not found, using defaults');
        this.loadDefaultPrompts();
      }
      
    } catch (error) {
      console.error('❌ Error loading prompts:', error.message);
      this.loadDefaultPrompts();
    }
  }

  /**
   * Load prompts from Render Secret Files (PRODUCTION)
   * Render mounts secret files to /etc/secrets/
   */
loadFromRenderSecretFiles() {
  try {
    const secretFilePath = '/etc/secrets/prompts.env';
    
    // DEBUG: Check what's in /etc/secrets/
    console.log('🔍 DEBUG: Checking /etc/secrets/ directory...');
    try {
      const secretsDir = fs.readdirSync('/etc/secrets/');
      console.log('📁 Files in /etc/secrets/:', secretsDir);
    } catch (dirError) {
      console.log('❌ Cannot read /etc/secrets/ directory:', dirError.message);
    }
    
    console.log('🔍 DEBUG: Checking exact file path:', secretFilePath);
    console.log('🔍 DEBUG: File exists:', fs.existsSync(secretFilePath));
    
    if (fs.existsSync(secretFilePath)) {
      console.log('✅ Found Render Secret File at:', secretFilePath);
      const content = fs.readFileSync(secretFilePath, 'utf8');
      console.log('🔍 DEBUG: File content length:', content.length);
      console.log('🔍 DEBUG: First 100 chars:', content.substring(0, 100));
      this.parsePromptsContent(content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error reading Render Secret File:', error.message);
    return false;
  }
}

  /**
   * Load prompts from environment variables (FALLBACK)
   */
  loadFromEnvironment() {
    const promptEnvVars = [
      'PROMPT_FIND_COMMON_FEATURES',
      'PROMPT_COPY_IMAGE_MIDJOURNEY',
      'PROMPT_COPY_IMAGE_DALLE',
      'PROMPT_COPY_IMAGE_STABLE_DIFFUSION',
      'PROMPT_COPY_IMAGE_GEMINI_IMAGEN',
      'PROMPT_COPY_IMAGE_FLUX',
      'PROMPT_COPY_IMAGE_LEONARDO',
      'PROMPT_COPY_CHARACTER_MIDJOURNEY',
      'PROMPT_COPY_CHARACTER_DALLE',
      'PROMPT_COPY_CHARACTER_STABLE_DIFFUSION',
      'PROMPT_COPY_CHARACTER_GEMINI_IMAGEN',
      'PROMPT_COPY_CHARACTER_FLUX',
      'PROMPT_COPY_CHARACTER_LEONARDO',
      'PROMPT_COPY_STYLE_MIDJOURNEY',
      'PROMPT_COPY_STYLE_DALLE',
      'PROMPT_COPY_STYLE_STABLE_DIFFUSION',
      'PROMPT_COPY_STYLE_GEMINI_IMAGEN',
      'PROMPT_COPY_STYLE_FLUX',
      'PROMPT_COPY_STYLE_LEONARDO'
    ];

    let loadedCount = 0;
    
    for (const envVar of promptEnvVars) {
      if (process.env[envVar]) {
        this.prompts[envVar] = process.env[envVar];
        loadedCount++;
      }
    }

    if (loadedCount === 0) {
      console.warn('⚠️ No prompt environment variables found, using defaults');
      this.loadDefaultPrompts();
    } else {
      console.log(`✅ Loaded ${loadedCount} prompts from environment variables`);
    }
  }

  /**
   * Parse prompts content from file
   */
  parsePromptsContent(content) {
    const lines = content.split('\n');
    let loadedCount = 0;
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        continue;
      }
      
      // Parse KEY="value" format
      const match = line.match(/^([A-Z_]+)="(.+)"$/);
      if (match) {
        const [, key, value] = match;
        this.prompts[key] = value;
        loadedCount++;
      }
    }
    
    console.log(`✅ Loaded ${loadedCount} prompts from file`);
  }

  /**
   * Fallback default prompts
   */
  loadDefaultPrompts() {
    this.prompts = {
      PROMPT_FIND_COMMON_FEATURES: "Analyze the uploaded images and provide a comprehensive visual analysis. Focus on: visual composition, colors and lighting, objects and subjects, artistic style and techniques, mood and atmosphere, and technical aspects. Write in natural, flowing paragraphs without any markdown formatting. Be detailed but concise.",
      
      PROMPT_COPY_IMAGE_MIDJOURNEY: "Create a detailed Midjourney prompt to recreate this image. Focus on: exact visual style, composition and framing, color palette, subject positioning, environmental details, camera angle, textures and materials. Format as a clean, single paragraph optimized for Midjourney v6+ without any markdown symbols or formatting.",
      
      PROMPT_COPY_IMAGE_DALLE: "Create a detailed DALL-E 3 prompt to recreate this image. Focus on: photorealistic details, exact composition, precise color descriptions, subject positioning and proportions, environmental context, lighting conditions, camera perspective. Write as a natural language description optimized for DALL-E 3's understanding, in a single clean paragraph without any formatting symbols."
    };
    
    console.log('📝 Using default fallback prompts');
  }

  getPrompt(goal, engine = null) {
    let promptKey;
    
    if (goal === 'find_common_features') {
      promptKey = 'PROMPT_FIND_COMMON_FEATURES';
    } else {
      const goalPart = goal.toUpperCase();
      const enginePart = engine ? engine.toUpperCase() : 'MIDJOURNEY';
      promptKey = `PROMPT_${goalPart}_${enginePart}`;
    }
    
    const prompt = this.prompts[promptKey];
    
    if (!prompt) {
      console.warn(`⚠️ Prompt not found: ${promptKey}, using fallback`);
      return this.prompts.PROMPT_FIND_COMMON_FEATURES || 'Analyze this image in detail.';
    }
    
    return prompt;
  }

  addCustomInstructions(basePrompt, customPrompt) {
    if (!customPrompt || !customPrompt.trim()) {
      return basePrompt;
    }
    
    return `${basePrompt}\n\nAdditional focus: ${customPrompt.trim()}`;
  }

  getAllPrompts() {
    return this.prompts;
  }

  reload() {
    this.prompts = {};
    this.loadPrompts();
  }
}

export default new PromptLoader();