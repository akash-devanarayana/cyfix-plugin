# Cypress Test Project

This project contains Cypress tests for the login functionality.

## Setup

1. Install dependencies:
```
npm install
```

## Running Tests

To run the tests, you need to:

1. Start the local server to serve the HTML files:
```
npm run serve
```

2. In a separate terminal, run Cypress in one of the following ways:

   - Open Cypress UI:
   ```
   npm run cypress:open
   ```

   - Run tests in headless mode:
   ```
   npm run cypress:run
   ```

## Troubleshooting

If you encounter issues with Cypress:

1. Make sure you have both the server running (`npm run serve`) and Cypress open in separate terminals
2. Check that the baseUrl in cypress.config.js matches your server URL (default: http://localhost:8080)
3. Verify that the HTML files exist in the public directory