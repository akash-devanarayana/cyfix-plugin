// Example Cypress test with CyFix integration
// Save this as cypress/e2e/login-test.cy.js

// This will be imported automatically if you've set up CyFix correctly
// in your cypress/support/e2e.js file

describe('Login Page Tests', () => {
    // Capture a baseline DOM snapshot before tests run
    // This will store the DOM structure of the login page
    // for future healing reference
    before(() => {
        cy.visit('https://example.com/login');
        cy.captureBaseline('login-test');
    });

    it('should login successfully with valid credentials', () => {
        // These selectors will be automatically healed if they break in the future
        cy.visit('https://example.com/login');

        // If this selector changes (e.g. from #username to #email),
        // CyFix will attempt to find the new selector automatically
        cy.get('#username').type('testuser');

        // If this selector changes (e.g. from #password to #pass),
        // CyFix will attempt to find the new selector automatically
        cy.get('#password').type('password123');

        // If this selector changes (e.g. class changes from .login-btn to .signin-btn),
        // CyFix will attempt to find the new selector automatically
        cy.get('.login-btn').click();

        // Verify login was successful
        cy.url().should('include', '/dashboard');
        cy.get('.welcome-message').should('contain', 'Welcome, Test User');
    });

    it('should show error message with invalid credentials', () => {
        cy.visit('https://example.com/login');

        // These selectors will be healed automatically if they break
        cy.get('#username').type('wronguser');
        cy.get('#password').type('wrongpassword');
        cy.get('.login-btn').click();

        // Check for error message
        cy.get('.error-message').should('be.visible');
        cy.get('.error-message').should('contain', 'Invalid credentials');
    });
});