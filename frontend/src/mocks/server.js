import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const baseURL = 'http://localhost:5000'

export const handlers = [
  // Health check endpoint
  http.get(`${baseURL}/health`, () => {
    return HttpResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: '100s',
      environment: 'test'
    })
  }),

  // Analysis endpoint - success
  http.post(`${baseURL}/api/analyze`, async ({ request }) => {
    const formData = await request.formData()
    const images = formData.getAll('images')
    const prompt = formData.get('prompt')

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return HttpResponse.json({
      success: true,
      analysis: `Test analysis for ${images.length} image(s). ${prompt ? `Custom prompt: ${prompt}` : ''}`,
      metadata: {
        requestId: 'test-123',
        processedImages: images.length,
        totalProcessingTimeMs: 1000,
        aiModel: 'gemini-1.5-flash',
        customPrompt: prompt,
        timestamp: new Date().toISOString()
      }
    })
  }),

  // Analysis endpoint - error scenarios
  http.post(`${baseURL}/api/analyze-error`, () => {
    return HttpResponse.json({
      success: false,
      error: 'Test error message',
      code: 'TEST_ERROR'
    }, { status: 500 })
  }),

  // Rate limit error
  http.post(`${baseURL}/api/analyze-rate-limit`, () => {
    return HttpResponse.json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    }, { status: 429 })
  }),

  // Config endpoint
  http.get(`${baseURL}/api/analyze/config`, () => {
    return HttpResponse.json({
      success: true,
      config: {
        upload: {
          maxFileSize: 10485760,
          maxFileSizeMB: 10,
          maxFiles: 10,
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        }
      }
    })
  })
]

export const server = setupServer(...handlers)