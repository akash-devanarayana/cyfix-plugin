// CyFix Setup Guide

/**
 * Step 1: Install CyFix packages
 *
 * npm install --save-dev cyfix-plugin
 *
 * Optional for using the backend service:
 * npm install --save-dev cyfix-server
 */

/**
 * Step 2: Configure Cypress plugin
 * Add this to your cypress.config.js file:
 */

// cypress.config.js
const {defineConfig} = require('cypress');
const cyfix = require('cyfix-plugin');

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // Register CyFix plugin
            return cyfix(on, config);
        },
    },
});

/**
 * Step 3: Import CyFix in support file
 * Add this to your cypress/support/e2e.js file:
 */

// cypress/support/e2e.js
import 'cyfix-plugin/dist/support';

// You can configure CyFix options
window.CyFix.configure({
    enabled: true,
    serverUrl: 'http://localhost:3000', // Optional: URL to CyFix server
    localHealingOnly: false,            // Set to true to disable server healing
    autoCapture: true,                  // Automatically capture baseline after tests
    minScore: 0.7                       // Minimum confidence score to accept healing
});

/**
 * Step 4: Start the CyFix server (optional)
 * Only needed if you want to use the server for storing and retrieving healing data
 *
 * Create a file like start-cyfix-server.js:
 */

// start-cyfix-server.js
const {CyFixServer} = require('cyfix-server');

const server = new CyFixServer(3000);
server.start()
    .then(() => {
        console.log('CyFix server started on port 3000');
    })
    .catch(error => {
        console.error('Failed to start CyFix server:', error);
        process.exit(1);
    });

/**
 * Step 5: Using CyFix in your tests
 *
 * Basic usage: Just write your Cypress tests normally.
 * CyFix will automatically heal any broken selectors.
 *
 * Advanced usage: Capture baselines explicitly for important pages:
 */

// Example test with explicit baseline capture
describe('My Important Test', () => {
    before(() => {
        cy.visit('/important-page');
        // Explicitly capture baseline for this test
        cy.captureBaseline('important-page-test');
    });

    it('should do something important', () => {
        // Your test code here
        // If selectors break, CyFix will heal them
    });
});

/**
 * Step 6: Disable CyFix for specific tests (if needed)
 */

describe('Test without healing', () => {
    before(() => {
        // Disable CyFix for this test suite
        cy.then(() => {
            window.CyFix.disable();
        });
    });

    after(() => {
        // Re-enable CyFix after this test suite
        cy.then(() => {
            window.CyFix.enable();
        });
    });

    it('should run without automatic healing', () => {
        // Test code here - no healing will occur
    });
});

/**
 * Step 7: Monitor healing performance
 *
 * If using the CyFix server, you can check healing statistics
 * by making requests to the server API:
 *
 * GET http://localhost:3000/api/stats/healing
 *
 * This will return information about healing success rates,
 * most common strategies, etc.
 */