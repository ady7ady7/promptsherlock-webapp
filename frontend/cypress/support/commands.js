// Custom command for file upload
Cypress.Commands.add('uploadFile', (selector, filePath, fileName, fileType = 'image/jpeg') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('test file content'),
    fileName: fileName,
    mimeType: fileType
  }, { force: true })
})

// Custom command for waiting for analysis
Cypress.Commands.add('waitForAnalysis', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 30000 }).should('not.exist')
  cy.contains('Analysis Complete', { timeout: 30000 }).should('be.visible')
})

// Custom command for API health check
Cypress.Commands.add('checkApiHealth', () => {
  cy.request('GET', `${Cypress.env('apiUrl')}/health`)
    .then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.status).to.eq('OK')
    })
})

// Custom command for accessibility testing
Cypress.Commands.add('checkA11y', (selector = null) => {
  cy.checkA11y(selector, {
    rules: {
      'color-contrast': { enabled: false } // Disable if using custom themes
    }
  })
})