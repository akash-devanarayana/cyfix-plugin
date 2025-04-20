# CyFix

CyFix is a self-healing test framework for Cypress that automatically repairs broken selectors in your tests. When UI elements change and cause your tests to fail, CyFix intelligently finds alternative selectors to keep your tests running.

## Features

- **Automatic Selector Healing**: Finds alternative selectors when the original ones break
- **Multiple Healing Strategies**: Uses various techniques to identify elements (ID, class, attributes, text, position)
- **Confidence Scoring**: Rates potential fixes by similarity to the original element
- **Historical Learning**: Remembers successful fixes for future use
- **Local & Server Modes**: Works both standalone and with a persistent server
- **Minimal Configuration**: Drop-in solution that works with existing Cypress tests
- **Detailed Logging**: Shows what was healed and how it was accomplished

## Architecture

CyFix consists of three main components:

1. **Cypress Plugin**: Intercepts failing selectors and requests healing
2. **Core Healing Algorithm**: Analyzes DOM structure to find alternative selectors
3. **Backend Service** (Optional): Stores DOM snapshots and healing history

## Installation

```bash
npm install --save-dev cyfix-plugin
```

For the optional server component:

```bash
npm install --save-dev cyfix-server
```

## Quick Setup

### 1. Configure Cypress plugin

Add to your `cypress.config.js`:

```javascript
const { defineConfig } = require('cypress');
const cyfix = require('cyfix-plugin');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return cyfix(on, config);
    },
  },
});
```

### 2. Import CyFix in support file

Add to your `cypress/support/e2e.js`:

```javascript
import 'cyfix-plugin/dist/support';
```

That's it! CyFix will now automatically attempt to heal broken selectors in your tests.

## How It Works

1. **Baseline Capture**: CyFix captures the DOM structure of your application during test development
2. **Selector Interception**: When a selector fails, CyFix intercepts the error
3. **Element Analysis**: CyFix analyzes the current DOM and compares it to the baseline
4. **Alternative Generation**: Multiple alternative selectors are generated and scored
5. **Selector Healing**: The best alternative is used to retry the command
6. **Result Reporting**: The healing is logged for visibility and future reference

## Advanced Configuration

You can configure CyFix options in your support file:

```javascript
window.CyFix.configure({
  enabled: true,
  serverUrl: 'http://localhost:3000',
  localHealingOnly: false,
  autoCapture: true,
  minScore: 0.7
});
```

## Using the Server Component

For persistent storage of DOM snapshots and healing history, you can run the CyFix server:

```javascript
const { CyFixServer } = require('cyfix-server');
const server = new CyFixServer(3000);
server.start();
```

## Example Usage

Write your Cypress tests normally - CyFix will handle the healing automatically:

```javascript
describe('Login Page Tests', () => {
  before(() => {
    cy.visit('/login');
    cy.captureBaseline('login-test'); // Optional but recommended
  });

  it('should login successfully', () => {
    cy.get('#username').type('testuser');
    cy.get('#password').type('password123');
    cy.get('.login-btn').click();
    cy.get('.welcome-message').should('be.visible');
  });
});
```

If any of these selectors break due to UI changes, CyFix will automatically find alternatives.

## License

MIT