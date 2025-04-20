// cypress.config.js
const {defineConfig} = require('cypress');
const cyfix = require('cyfix-plugin');

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            return cyfix(on, config);
        },
    },
});