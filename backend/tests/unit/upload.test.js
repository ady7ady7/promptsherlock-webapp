const request = require('supertest')
const app = require('../../server')
const fs = require('fs-extra')
const path = require('path')

describe('Upload Middleware Unit Tests', () => {
  const testUploadDir = path.join(__dirname, '../test-uploads')
  
  beforeAll(async () => {
    await fs.ensureDir(testUploadDir)
  })
  
  afterAll(async () => {
    await fs.remove(testUploadDir)
  })

  describe('File Validation', () => {
    it('should accept valid image files', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', Buffer.from('fake-jpeg'), 'test.jpg')
        .expect(400) // Will fail validation but should pass upload middleware
      
      expect(response.body.code).not.toBe('INVALID_MIME_TYPE')
    })

    it('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', Buffer.from('fake-pdf'), 'test.pdf')
        .expect(400)
      
      expect(response.body.code).toBe('INVALID_MIME_TYPE')
    })

    it('should reject files that are too large', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024) // 11MB
      
      const response = await request(app)
        .post('/api/analyze')
        .attach('images', largeBuffer, 'large.jpg')
        .expect(400)
      
      expect(response.body.code).toBe('FILE_TOO_LARGE')
    })

    it('should reject too many files', async () => {
      const agent = request(app).post('/api/analyze')
      
      // Attach 11 files (over limit of 10)
      for (let i = 0; i < 11; i++) {
        agent.attach('images', Buffer.from(`image-${i}`), `image-${i}.jpg`)
      }
      
      const response = await agent.expect(400)
      expect(response.body.code).toBe('TOO_MANY_FILES')
    })

    it('should reject malicious filenames', async () => {
      const maliciousNames = [
        '../../../etc/passwd',
        'test.php.jpg',
        'image.exe.jpg',
        'con.jpg',
        'test\0null.jpg'
      ]
      
      for (const filename of maliciousNames) {
        const response = await request(app)
          .post('/api/analyze')
          .attach('images', Buffer.from('test'), filename)
          .expect(400)
        
        expect(response.body.code).toMatch(/INVALID_FILENAME|MALICIOUS_FILENAME|DANGEROUS_FILENAME/)
      }
    })
  })

  describe('File Cleanup', () => {
    it('should clean up files after processing', async () => {
      const { cleanupFiles } = require('../../utils/cleanup')
      
      // Create test files
      const testFiles = [
        {
          path: path.join(testUploadDir, 'test1.jpg'),
          filename: 'test1.jpg'
        },
        {
          path: path.join(testUploadDir, 'test2.jpg'),
          filename: 'test2.jpg'
        }
      ]
      
      // Create actual files
      for (const file of testFiles) {
        await fs.writeFile(file.path, 'test content')
        expect(await fs.pathExists(file.path)).toBe(true)
      }
      
      // Clean up files
      await cleanupFiles(testFiles)
      
      // Verify files are deleted
      for (const file of testFiles) {
        expect(await fs.pathExists(file.path)).toBe(false)
      }
    })

    it('should handle cleanup errors gracefully', async () => {
      const { cleanupFiles } = require('../../utils/cleanup')
      
      const invalidFiles = [
        {
          path: '/nonexistent/path/file.jpg',
          filename: 'file.jpg'
        }
      ]
      
      // Should not throw error
      await expect(cleanupFiles(invalidFiles)).resolves.not.toThrow()
    })
  })
})