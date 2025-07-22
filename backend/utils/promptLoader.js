// backend/utils/promptLoader.js
// EXTREME DEBUG VERSION - Let's see what the fuck is going on
// UPDATED: Removed find_common_features and copy_character references

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

  loadFromRenderSecretFiles() {
    try {
      const secretFilePath = '/etc/secrets/prompts.env';
      
      console.log('🔍 DEBUG: Checking exact file path:', secretFilePath);
      console.log('🔍 DEBUG: File exists:', fs.existsSync(secretFilePath));
      
      if (fs.existsSync(secretFilePath)) {
        console.log('✅ Found Render Secret File at:', secretFilePath);
        const content = fs.readFileSync(secretFilePath, 'utf8');
        console.log('🔍 DEBUG: File content length:', content.length);
        console.log('🔍 DEBUG: First 200 chars:', content.substring(0, 200));
        console.log('🔍 DEBUG: Last 200 chars:', content.substring(content.length - 200));
        
        // Let's see exactly what lines we have
        const lines = content.split('\n');
        console.log('🔍 DEBUG: Total lines in file:', lines.length);
        console.log('🔍 DEBUG: First 10 lines:');
        for (let i = 0; i < Math.min(10, lines.length); i++) {
          console.log(`   Line ${i + 1}: "${lines[i]}"`);
        }
        
        this.parsePromptsContent(content);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error reading Render Secret File:', error.message);
      return false;
    }
  }

  // UPDATED: Removed find_common_features and copy_character from environment variables
  loadFromEnvironment() {
    const promptEnvVars = [
      // Only copy_image and copy_style prompts
      'PROMPT_COPY_IMAGE_MIDJOURNEY',
      'PROMPT_COPY_IMAGE_DALLE',
      'PROMPT_COPY_IMAGE_STABLE_DIFFUSION',
      'PROMPT_COPY_IMAGE_GEMINI_IMAGEN',
      'PROMPT_COPY_IMAGE_FLUX',
      'PROMPT_COPY_IMAGE_LEONARDO',
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
        console.log(`✅ Loaded from env: ${envVar} (${process.env[envVar].length} chars)`);
      } else {
        console.log(`❌ Missing from env: ${envVar}`);
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
   * SIMPLE PARSER - Let's try the most basic approach first
   */
  parsePromptsContent(content) {
    console.log('🔥 EXTREME DEBUG: Starting parse...');
    console.log('🔥 Content preview (first 500 chars):');
    console.log(content.substring(0, 500));
    console.log('🔥 Content preview (chars 500-1000):');
    console.log(content.substring(500, 1000));
    
    let loadedCount = 0;
    
    // Split by lines first
    const lines = content.split('\n');
    console.log(`🔥 Total lines: ${lines.length}`);
    
    // Look for lines that start with PROMPT_
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log(`🔥 Line ${i + 1}: "${line.substring(0, 50)}..."`);
      
      if (line.startsWith('PROMPT_')) {
        console.log(`🔥 Found potential prompt line: ${line.substring(0, 100)}`);
        
        // Try to extract key=value
        const equalsIndex = line.indexOf('=');
        if (equalsIndex > 0) {
          const key = line.substring(0, equalsIndex);
          let value = line.substring(equalsIndex + 1);
          
          // Remove surrounding quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith('"')) {
            // Multi-line value - collect until we find the closing quote
            value = value.slice(1); // Remove opening quote
            
            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j];
              if (nextLine.endsWith('"')) {
                value += '\n' + nextLine.slice(0, -1); // Remove closing quote
                i = j; // Skip these lines
                break;
              } else {
                value += '\n' + nextLine;
              }
            }
          }
          
          this.prompts[key] = value;
          loadedCount++;
          console.log(`🔥 LOADED: ${key} (${value.length} chars)`);
          console.log(`🔥 Preview: ${value.substring(0, 100)}...`);
        }
      }
    }
    
    console.log(`🔥 FINAL RESULT: Loaded ${loadedCount} prompts`);
    console.log(`🔥 Keys found:`, Object.keys(this.prompts));
    
    // If still nothing, try a different approach
    if (loadedCount === 0) {
      console.log('🔥 FALLBACK: Trying regex approach...');
      this.tryRegexParse(content);
    }
  }
  
  tryRegexParse(content) {
    console.log('🔥 Trying regex-based parsing...');
    
    // Try to find PROMPT_XXX="..." patterns
    const promptRegex = /(PROMPT_[A-Z_]+)="([^"]*(?:"[^"]*"[^"]*)*[^"]*)"/g;
    let match;
    let loadedCount = 0;
    
    while ((match = promptRegex.exec(content)) !== null) {
      const [, key, value] = match;
      this.prompts[key] = value;
      loadedCount++;
      console.log(`🔥 REGEX LOADED: ${key} (${value.length} chars)`);
    }
    
    if (loadedCount === 0) {
      console.log('🔥 REGEX FAILED TOO. Using defaults.');
      this.loadDefaultPrompts();
    }
  }

  // UPDATED: Removed find_common_features and copy_character from defaults
  loadDefaultPrompts() {
    this.prompts = {
      // Only copy_image and copy_style default prompts
      PROMPT_COPY_IMAGE_MIDJOURNEY: "Create a detailed Midjourney prompt to recreate this image. Focus on: exact visual style, composition and framing, color palette, subject positioning, environmental details, camera angle, textures and materials. Format as a clean, single paragraph optimized for Midjourney v6+ without any markdown symbols or formatting.",
      
      PROMPT_COPY_IMAGE_DALLE: "Create a detailed DALL-E 3 prompt to recreate this image. Focus on: photorealistic details, exact composition, precise color descriptions, subject positioning and proportions, environmental context, lighting conditions, camera perspective. Write as a natural language description optimized for DALL-E 3's understanding, in a single clean paragraph without any formatting symbols.",
      
      PROMPT_COPY_IMAGE_STABLE_DIFFUSION: "Create a detailed Stable Diffusion prompt to recreate this image. Focus on: visual style and aesthetics, exact composition, color palette and lighting, subject details and positioning, background and environment, camera angle and perspective. Use comma-separated keywords and phrases optimized for Stable Diffusion, in a single paragraph without formatting.",
      
      PROMPT_COPY_IMAGE_GEMINI_IMAGEN: "Create a detailed Gemini Imagen prompt to recreate this image. Focus on: photorealistic accuracy, composition and framing, color and lighting details, subject characteristics, environmental context, camera perspective. Write as a natural, descriptive paragraph optimized for Gemini Imagen without any formatting symbols.",
      
      PROMPT_COPY_IMAGE_FLUX: "Create a detailed Flux prompt to recreate this image. Focus on: artistic style and technique, exact composition, color scheme and lighting, subject positioning, environmental details, camera angle. Format as a descriptive paragraph optimized for Flux generation without any markdown or formatting symbols.",
      
      PROMPT_COPY_IMAGE_LEONARDO: "Create a detailed Leonardo AI prompt to recreate this image. Focus on: visual style and aesthetics, composition and framing, color palette, subject details and positioning, environmental context, lighting and shadows, camera perspective. Write as a descriptive paragraph optimized for Leonardo AI without any formatting symbols.",
      
      // Copy Style prompts
      PROMPT_COPY_STYLE_MIDJOURNEY: "Analyze this image and create a Midjourney style prompt that captures the artistic style, visual aesthetics, and creative approach. Focus on: artistic technique and medium, color palette and mood, lighting style, composition approach, texture and material qualities, overall aesthetic feel. Format as a style description optimized for Midjourney without any formatting symbols.",
      
      PROMPT_COPY_STYLE_DALLE: "Analyze this image and create a DALL-E 3 style prompt that captures the artistic style and visual approach. Focus on: art style and technique, color scheme and mood, lighting characteristics, composition style, texture and material appearance, overall aesthetic quality. Write as a natural style description optimized for DALL-E 3 without any formatting symbols.",
      
      PROMPT_COPY_STYLE_STABLE_DIFFUSION: "Analyze this image and create a Stable Diffusion style prompt that captures the visual style and artistic approach. Focus on: art style and medium, color palette and mood, lighting technique, composition approach, texture and material qualities, aesthetic characteristics. Use style-focused keywords optimized for Stable Diffusion without formatting.",
      
      PROMPT_COPY_STYLE_GEMINI_IMAGEN: "Analyze this image and create a Gemini Imagen style prompt that captures the artistic style and visual aesthetics. Focus on: artistic technique and approach, color scheme and mood, lighting style, composition characteristics, texture and material qualities, overall visual feel. Write as a style description optimized for Gemini Imagen without formatting.",
      
      PROMPT_COPY_STYLE_FLUX: "Analyze this image and create a Flux style prompt that captures the artistic style and creative approach. Focus on: art style and technique, color palette and mood, lighting characteristics, composition style, texture and material appearance, aesthetic qualities. Format as a style description optimized for Flux without any formatting symbols.",
      
      PROMPT_COPY_STYLE_LEONARDO: "Analyze this image and create a Leonardo AI style prompt that captures the artistic style and visual approach. Focus on: art technique and medium, color scheme and mood, lighting style, composition characteristics, texture and material qualities, overall aesthetic feel. Write as a style description optimized for Leonardo AI without formatting symbols."
    };
    
    console.log('📝 Using default fallback prompts for copy_image and copy_style only');
  }

  // UPDATED: Removed find_common_features logic from getPrompt
  getPrompt(goal, engine = null) {
    let promptKey;
    
    console.log('🔍 DEBUG: Looking for prompt key:', goal, engine);
    console.log('🔍 DEBUG: Available keys:', Object.keys(this.prompts));
    
    // Build prompt key based on goal and engine
    const goalPart = goal.toUpperCase();
    const enginePart = engine ? engine.toUpperCase() : 'MIDJOURNEY';
    promptKey = `PROMPT_${goalPart}_${enginePart}`;
    
    const prompt = this.prompts[promptKey];
    
    if (!prompt) {
      console.warn(`⚠️ Prompt not found: ${promptKey}, using fallback`);
      // Return first available copy_image prompt as fallback
      const fallbackKey = Object.keys(this.prompts).find(key => key.includes('COPY_IMAGE'));
      return this.prompts[fallbackKey] || 'Analyze this image in detail.';
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