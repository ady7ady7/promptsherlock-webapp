describe('Image Analysis E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.checkApiHealth()
  })

  it('should load the homepage correctly', () => {
    cy.contains('ImageAnalyzer').should('be.visible')
    cy.contains('Transform your images into detailed insights').should('be.visible')
    cy.get('[data-testid="dropzone"]').should('be.visible')
    
    // Check accessibility
    cy.checkA11y()
  })

  it('should handle single image upload and analysis', () => {
    // Upload single image
    cy.uploadFile('[data-testid="file-input"]', 'test-image.jpg', 'test-image.jpg')
    
    // Verify image appears in preview
    cy.contains('Selected Images (1/10)').should('be.visible')
    cy.get('img[alt="test-image.jpg"]').should('be.visible')
    
    // Add custom prompt
    cy.get('textarea[placeholder*="Describe what you\'d like me to focus on"]')
      .type('Focus on the main objects in the image')
    
    // Submit analysis
    cy.contains('button', 'Analyze 1 Image').click()
    
    // Verify loading state
    cy.contains('Analyzing Your Images').should('be.visible')
    cy.contains('This usually takes 30-60 seconds').should('be.visible')
    
    // Wait for analysis completion
    cy.waitForAnalysis()
    
    // Verify results
    cy.contains('Analysis Complete').should('be.visible')
    cy.get('[data-testid="analysis-results"]').should('contain.text', 'Analysis')
    
    // Check metadata
    cy.contains('Images: 1').should('be.visible')
    cy.contains('Processing Time:').should('be.visible')
  })

  it('should handle multiple image upload', () => {
    // Upload multiple images
    const fileNames = ['image1.jpg', 'image2.jpg', 'image3.jpg']
    
    fileNames.forEach((fileName, index) => {
      cy.uploadFile('[data-testid="file-input"]', fileName, fileName)
      cy.contains(`Selected Images (${index + 1}/10)`).should('be.visible')
    })
    
    // Submit analysis
    cy.contains('button', 'Analyze 3 Images').click()
    
    // Wait for completion
    cy.waitForAnalysis()
    
    // Verify results mention multiple images
    cy.get('[data-testid="analysis-results"]').should('contain.text', '3 image')
  })

  it('should handle file validation errors', () => {
    // Try to upload invalid file type
    cy.uploadFile('[data-testid="file-input"]', 'document.pdf', 'document.pdf', 'application/pdf')
    
    // Verify error message
    cy.contains('Invalid file type').should('be.visible')
    cy.contains('Only images are allowed').should('be.visible')
  })

  it('should handle maximum file limit', () => {
    // Upload 11 files (over limit of 10)
    for (let i = 1; i <= 11; i++) {
      cy.uploadFile('[data-testid="file-input"]', `image${i}.jpg`, `image${i}.jpg`)
      
      if (i <= 10) {
        cy.contains(`Selected Images (${i}/10)`).should('be.visible')
      } else {
        cy.contains('Too many files').should('be.visible')
        cy.contains('Maximum 10 files allowed').should('be.visible')
      }
    }
  })

  it('should handle network errors gracefully', () => {
    // Intercept API call and force network error
    cy.intercept('POST', '**/api/analyze', { forceNetworkError: true }).as('analyzeError')
    
    // Upload image and submit
    cy.uploadFile('[data-testid="file-input"]', 'test-image.jpg', 'test-image.jpg')
    cy.contains('button', 'Analyze 1 Image').click()
    
    // Wait for error
    cy.wait('@analyzeError')
    
    // Verify error handling
    cy.contains('Analysis Failed').should('be.visible')
    cy.contains('Network error').should('be.visible')
  })

it('should be responsive on mobile devices', () => {
   // Test mobile viewport
   cy.viewport('iphone-x')
   
   // Verify elements are still visible and usable
   cy.contains('ImageAnalyzer').should('be.visible')
   cy.get('[data-testid="dropzone"]').should('be.visible')
   
   // Test file upload on mobile
   cy.uploadFile('[data-testid="file-input"]', 'mobile-test.jpg', 'mobile-test.jpg')
   cy.contains('Selected Images (1/10)').should('be.visible')
   
   // Verify mobile-friendly layout
   cy.get('[data-testid="image-grid"]').should('have.class', 'grid-cols-2')
   
   // Test tablet viewport
   cy.viewport('ipad-2')
   cy.get('[data-testid="image-grid"]').should('have.class', 'md:grid-cols-3')
 })

 it('should handle analysis reset and retry', () => {
   // Complete an analysis
   cy.uploadFile('[data-testid="file-input"]', 'test-image.jpg', 'test-image.jpg')
   cy.contains('button', 'Analyze 1 Image').click()
   cy.waitForAnalysis()
   
   // Reset form
   cy.contains('button', 'Analyze New Images').click()
   
   // Verify reset
   cy.contains('Upload Your Images').should('be.visible')
   cy.get('[data-testid="file-input"]').should('be.visible')
   
   // Upload new image and analyze again
   cy.uploadFile('[data-testid="file-input"]', 'retry-test.jpg', 'retry-test.jpg')
   cy.contains('button', 'Analyze 1 Image').click()
   cy.waitForAnalysis()
   
   // Verify second analysis
   cy.contains('Analysis Complete').should('be.visible')
 })

 it('should navigate between pages correctly', () => {
   // Test navigation to privacy page
   cy.contains('a', 'Privacy Policy').click()
   cy.url().should('include', '/privacy')
   cy.contains('Privacy Policy').should('be.visible')
   cy.contains('Your privacy is our top priority').should('be.visible')
   
   // Navigate back to home
   cy.contains('a', 'Back to Home').click()
   cy.url().should('eq', Cypress.config().baseUrl + '/')
   
   // Test navigation to terms page
   cy.contains('a', 'Terms of Service').click()
   cy.url().should('include', '/terms')
   cy.contains('Terms of Service').should('be.visible')
   
   // Test 404 page
   cy.visit('/nonexistent-page')
   cy.contains('404').should('be.visible')
   cy.contains('Page Not Found').should('be.visible')
 })
})