const request = require('supertest')
const app = require('../../server')

describe('Security Tests', () => {
  describe('Input Validation', () => {
    it('should sanitize malicious file names', async () => {
      const maliciousPayloads = [
        '../../../etc/passwd',
        '<script>alert("xss")</script>',
        '"; DROP TABLE users; --',
        'test.php.jpg',
        'con.jpg'
      ]
      
      for (const payload of maliciousPayloads) {
        const response = await request(app)
          .post('/api/analyze')
          .attach('images', Buffer.from('test'), payload)
          .expect(400)
        
        expect(response.body.success).toBe(false)
      }
    })

    it('should prevent directory traversal in uploads', async () => {
      const traversalAttempts = [
        '../uploads/malicious.jpg',
        '../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam'
      ]
      
      for (const attempt of traversalAttempts) {
        const response = await request(app)
          .post('/api/analyze')
          .attach('images', Buffer.from('test'), attempt)
          .expect(400)
        
        expect(response.body.code).toMatch(/INVALID_FILENAME|MALICIOUS_FILENAME/)
      }
    })

    it('should validate content-type headers', async () => {
      // Attempt to upload with mismatched content-type
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', Buffer.from('<?php echo "hack"; ?>'), 'test.jpg')
        .expect(400) // Should be rejected by validation
    })

    it('should enforce rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(6).fill().map(() => 
        request(app)
          .get('/health')
          .set('X-Forwarded-For', '192.168.1.100')
      )
      
      const responses = await Promise.all(requests)
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('File Upload Security', () => {
    it('should reject executable files', async () => {
      const executableTypes = [
        { buffer: Buffer.from('MZ'), name: 'malware.exe', type: 'application/x-msdownload' },
        { buffer: Buffer.from('#!/bin/bash'), name: 'script.sh', type: 'application/x-sh' },
        { buffer: Buffer.from('<?php'), name: 'shell.php', type: 'application/x-php' }
      ]
      
      for (const file of executableTypes) {
        const response = await request(app)
          .post('/api/analyze')
          .attach('images', file.buffer, file.name)
          .expect(400)
        
        expect(response.body.success).toBe(false)
      }
    })

    it('should validate file signatures', async () => {
      // Test file with wrong signature
      const fakeJpeg = Buffer.from('This is not a JPEG file')
      
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', fakeJpeg, 'fake.jpg')
        // May pass upload validation but should fail in AI processing
        .expect(res => {
          expect(res.status).toBeGreaterThanOrEqual(400)
        })
    })
  })

  describe('Response Security', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
      
      expect(response.headers['x-frame-options']).toBeDefined()
      expect(response.headers['x-content-type-options']).toBeDefined()
      expect(response.headers['x-xss-protection']).toBeDefined()
    })

    it('should not leak sensitive information in errors', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', Buffer.from('invalid'), 'test.jpg')
        .expect(res => {
          // Should not contain stack traces or internal paths
          expect(JSON.stringify(res.body)).not.toMatch(/\/var\/www|node_modules|stack/i)
        })
    })
  })

  describe('Environment Security', () => {
    it('should not expose environment variables', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
      
      // Should not contain sensitive env vars
      expect(JSON.stringify(response.body)).not.toMatch(/GEMINI_API_KEY|SECRET/i)
    })
  })
})