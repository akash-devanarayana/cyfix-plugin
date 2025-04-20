// cypress.config.js
const {defineConfig} = require('cypress');
const cyfix = require('cyfix-plugin').default;

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            return cyfix(on, config);
        },
        baseUrl: 'http://localhost:8080',
        supportFile: 'cypress/support/e2e.js',
        specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    },
});
