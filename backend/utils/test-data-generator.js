const fs = require('fs-extra')
const path = require('path')
const sharp = require('sharp')

class TestDataGenerator {
  constructor() {
    this.testDataDir = path.join(__dirname, '../test-data')
  }

  async initialize() {
    await fs.ensureDir(this.testDataDir)
  }

  async generateTestImage(width = 800, height = 600, filename = 'test-image.jpg') {
    const imagePath = path.join(this.testDataDir, filename)
    
    // Generate a test image with colored rectangles
    const svg = `
      <svg width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#4F46E5"/>
        <rect x="${width/4}" y="${height/4}" width="${width/2}" height="${height/2}" fill="#EC4899"/>
        <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="white" font-size="24">TEST IMAGE</text>
      </svg>
    `
    
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(imagePath)
    
    return imagePath
  }

  async generateTestImages(count = 5) {
    const images = []
    
    for (let i = 1; i <= count; i++) {
      const filename = `test-image-${i}.jpg`
      const imagePath = await this.generateTestImage(
        800 + (i * 100), 
        600 + (i * 50), 
        filename
      )
      images.push(imagePath)
    }
    
    return images
  }

  async generateLargeImage(sizeInMB = 12) {
    const filename = 'large-test-image.jpg'
    const imagePath = path.join(this.testDataDir, filename)
    
    // Generate a large image that exceeds size limits
    const dimension = Math.sqrt(sizeInMB * 1024 * 1024 / 3) // Rough calculation
    
    await sharp({
      create: {
        width: Math.floor(dimension),
        height: Math.floor(dimension),
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .jpeg({ quality: 100 })
    .toFile(imagePath)
    
    return imagePath
  }

  async generateCorruptedImage() {
    const filename = 'corrupted-image.jpg'
    const imagePath = path.join(this.testDataDir, filename)
    
    // Create a file that looks like a JPEG but is corrupted
    const corruptedData = Buffer.concat([
      Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG header
      Buffer.from('This is not valid JPEG data'),
      Buffer.from([0xFF, 0xD9]) // JPEG footer
    ])
    
    await fs.writeFile(imagePath, corruptedData)
    return imagePath
  }

  async cleanup() {
    await fs.remove(this.testDataDir)
  }
}

module.exports = TestDataGenerator