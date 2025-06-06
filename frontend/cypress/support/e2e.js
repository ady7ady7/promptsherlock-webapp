import './commands'
import 'cypress-axe'

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').callThrough()
  cy.stub(win.console, 'warn').callThrough()
})

// Global before hook
beforeEach(() => {
  // Inject axe for accessibility testing
  cy.injectAxe()
})