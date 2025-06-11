// backend/utils/promptLoader.js
// Utility to load prompts from prompts.env file

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load and parse prompts from prompts.env file
 */
class PromptLoader {
  constructor() {
    this.prompts = {};
    this.loadPrompts();
  }

  /**
   * Load prompts from prompts.env file
   */
  loadPrompts() {
    try {
      const promptsPath = path.join(__dirname, '../../prompts.env');
      
      if (!fs.existsSync(promptsPath)) {
        console.warn('⚠️ prompts.env file not found, using default prompts');
        this.loadDefaultPrompts();
        return;
      }

      const content = fs.readFileSync(promptsPath, 'utf8');
      this.parsePromptsContent(content);
      
      console.log('✅ Loaded prompts from prompts.env');
      
    } catch (error) {
      console.error('❌ Error loading prompts.env:', error.message);
      this.loadDefaultPrompts();
    }
  }

  /**
   * Parse prompts content and extract variables
   */
  parsePromptsContent(content) {
    const lines = content.split('\n');
    
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
      }
    }
  }

  /**
   * Fallback default prompts if file not found
   */
  loadDefaultPrompts() {
    this.prompts = {
      PROMPT_FIND_COMMON_FEATURES: "Analyze the uploaded images and provide a comprehensive visual analysis. Focus on: visual composition, colors and lighting, objects and subjects, artistic style and techniques, mood and atmosphere, and technical aspects. Write in natural, flowing paragraphs without any markdown formatting. Be detailed but concise.",
      
      PROMPT_COPY_IMAGE_MIDJOURNEY: "Create a detailed Midjourney prompt to recreate this image. Focus on: exact visual style, composition and framing, color palette, subject positioning, environmental details, camera angle, textures and materials. Format as a clean, single paragraph optimized for Midjourney v6+ without any markdown symbols or formatting.",
      
      PROMPT_COPY_IMAGE_DALLE: "Create a detailed DALL-E 3 prompt to recreate this image. Focus on: photorealistic details, exact composition, precise color descriptions, subject positioning and proportions, environmental context, lighting conditions, camera perspective. Write as a natural language description optimized for DALL-E 3's understanding, in a single clean paragraph without any formatting symbols.",
      
      // Add other default prompts here...
    };
    
    console.log('📝 Using default prompts');
  }

  /**
   * Get prompt by goal and engine
   */
  getPrompt(goal, engine = null) {
    let promptKey;
    
    if (goal === 'find_common_features') {
      promptKey = 'PROMPT_FIND_COMMON_FEATURES';
    } else {
      // Build prompt key: PROMPT_{GOAL}_{ENGINE}
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

  /**
   * Add custom instructions to prompt
   */
  addCustomInstructions(basePrompt, customPrompt) {
    if (!customPrompt || !customPrompt.trim()) {
      return basePrompt;
    }
    
    return `${basePrompt}\n\nAdditional focus: ${customPrompt.trim()}`;
  }

  /**
   * Get all available prompts (for debugging)
   */
  getAllPrompts() {
    return this.prompts;
  }

  /**
   * Reload prompts from file (useful for development)
   */
  reload() {
    this.prompts = {};
    this.loadPrompts();
  }
}

// Export singleton instance
export default new PromptLoader();