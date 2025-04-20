"use strict";
// CyFix Support File
// This file should be imported in cypress/support/e2e.js or cypress/support/index.js
Object.defineProperty(exports, "__esModule", { value: true });
const commands_1 = require("./commands");
// Install CyFix commands in Cypress
(0, commands_1.installCommands)();
// Log initialization message
Cypress.log({
    name: 'cyfix',
    message: 'CyFix initialized',
    consoleProps: () => ({
        'Enabled': Cypress.env('CYFIX_ENABLED'),
        'Server URL': Cypress.env('CYFIX_SERVER_URL'),
        'Version': '0.1.0' // TODO: Get this from package.json
    })
});
// Listen for test failures to gather additional data
Cypress.on('test:after:run', (test) => {
    if (test.state === 'failed') {
        // We could capture additional information about failed tests here
        // This could be useful for improving healing algorithms
        console.log(`Test failed: ${test.title}`);
    }
});
// Export a global CyFix object that can be used for configuration
// @ts-ignore - Adding to global window object
window.CyFix = {
    configure: (options) => {
        // Apply configuration options
        Object.entries(options).forEach(([key, value]) => {
            Cypress.env(`CYFIX_${key.toUpperCase()}`, value);
        });
    },
    disable: () => {
        Cypress.env('CYFIX_ENABLED', false);
    },
    enable: () => {
        Cypress.env('CYFIX_ENABLED', true);
    }
};
