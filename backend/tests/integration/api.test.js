const request = require('supertest')
const app = require('../../server')
const fs = require('fs-extra')
const path = require('path')

describe('API Integration Tests', () => {
  // Mock Gemini AI responses
  beforeAll(() => {
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => 'Mock AI analysis result for testing'
            }
          })
        })
      }))
    }))
  })

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
      
      expect(response.body.status).toBe('OK')
      expect(response.body.environment).toBeDefined()
      expect(response.body.uptime).toBeDefined()
    })
  })

  describe('Analysis Config Endpoint', () => {
    it('should return configuration', async () => {
      const response = await request(app)
        .get('/api/analyze/config')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.config.upload.maxFiles).toBe(10)
      expect(response.body.config.upload.maxFileSizeMB).toBe(10)
    })
  })

  describe('Image Analysis Endpoint', () => {
    const createTestImage = () => {
      // Create a minimal valid JPEG buffer
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])
      const jpegFooter = Buffer.from([0xFF, 0xD9])
      return Buffer.concat([jpegHeader, Buffer.alloc(100, 0), jpegFooter])
    }

    it('should analyze single image successfully', async () => {
      const testImage = createTestImage()
      
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', testImage, 'test.jpg')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.analysis).toContain('Mock AI analysis')
      expect(response.body.metadata.processedImages).toBe(1)
    })

    it('should analyze multiple images', async () => {
      const testImage = createTestImage()
      
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', testImage, 'test1.jpg')
        .attach('images', testImage, 'test2.jpg')
        .attach('images', testImage, 'test3.jpg')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.metadata.processedImages).toBe(3)
    })

    it('should handle custom prompts', async () => {
      const testImage = createTestImage()
      const customPrompt = 'Focus on the colors in this image'
      
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', testImage, 'test.jpg')
        .field('prompt', customPrompt)
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.metadata.customPrompt).toBe(customPrompt)
    })

    it('should require at least one image', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('NO_FILES_UPLOADED')
    })

    it('should validate prompt length', async () => {
      const testImage = createTestImage()
      const longPrompt = 'x'.repeat(1001)
      
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', testImage, 'test.jpg')
        .field('prompt', longPrompt)
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('PROMPT_TOO_LONG')
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 for invalid endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404)
      
      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('ENDPOINT_NOT_FOUND')
    })

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/analyze')
        .set('Origin', 'http://localhost:5173')
        .expect(200)
      
      expect(response.headers['access-control-allow-origin']).toBeDefined()
    })
  })
})