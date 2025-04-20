// cypress/support/e2e.js
import 'cyfix-plugin/dist/support';

// Configure CyFix
window.CyFix = window.CyFix || {};
window.CyFix.configure({
    enabled: true,
    localHealingOnly: true
});