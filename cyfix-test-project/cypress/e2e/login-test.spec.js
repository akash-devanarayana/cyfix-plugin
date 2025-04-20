// cypress/e2e/login-test.spec.js
describe('Login Page Tests', () => {
    before(() => {
        cy.visit('login.html');
        cy.captureBaseline('login-test');
    });

    it('should login successfully', () => {
        cy.visit('login.html');
        cy.get('#username').type('testuser');
        cy.get('#password').type('password123');
        cy.get('.login-btn').click();
        cy.get('.welcome-message').should('be.visible');
    });
});
