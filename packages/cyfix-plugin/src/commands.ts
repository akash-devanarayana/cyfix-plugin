/// <reference types="cypress" />

import {DOMSnapshot, HealingResult} from './types';

/**
 * Captures the current DOM as a serialized snapshot
 */
function captureDOMSnapshot(): DOMSnapshot {
    // Simple implementation of DOM serialization
    function serializeNode(node: Element): any {
        const attributes: Record<string, string> = {};

        // Capture all attributes
        Array.from(node.attributes).forEach(attr => {
            attributes[attr.name] = attr.value;
        });

        // Serialize children (elements only, skip text nodes for simplicity)
        const children = Array.from(node.children).map(child => serializeNode(child));

        return {
            tagName: node.tagName.toLowerCase(),
            id: node.id || undefined,
            className: node.className || undefined,
            attributes,
            textContent: node.textContent?.trim() || undefined,
            children
        };
    }

    // Get basic page info
    const url = window.location.href;
    const title = document.title;
    const timestamp = Date.now();

    // Serialize the DOM starting from the document body
    const rootNode = serializeNode(document.body);

    return {
        url,
        title,
        timestamp,
        rootNode
    };
}

/**
 * Installs CyFix commands in Cypress
 */
export function installCommands(): void {
    // Store original command implementations using type assertion to bypass TypeScript checking
    // These properties exist at runtime but aren't exposed in Cypress types
    const originalGet = (Cypress.Commands as any)._commands?.get?.fn;
    const originalFind = (Cypress.Commands as any)._commands?.find?.fn;

    if (!originalGet || !originalFind) {
        throw new Error('Could not find original Cypress commands to override');
    }

    // Override the 'get' command to add self-healing capability
    Cypress.Commands.overwrite('get', (originalFn: any, selector: string, options: any = {}) => {
        // Skip healing if disabled via environment variable
        if (Cypress.env('CYFIX_ENABLED') === false) {
            return originalFn(selector, options);
        }

        // Create a wrapped version to handle errors
        const wrappedFn = () => {
            try {
                const result = originalFn(selector, options);

                // Attach our own error handler to handle element not found errors
                const originalThen = result.then;
                result.then = function (resolveCallback: any, rejectCallback?: any) {
                    // If no reject callback provided, we'll add our healing logic
                    if (!rejectCallback) {
                        return originalThen.call(this, resolveCallback, (error: Error) => {
                            if (error.message.includes('failed to find element') ||
                                error.message.includes('could not be found')) {
                                // Attempt healing
                                return handleHealingForSelector(error, selector, options, originalFn);
                            }
                            // Otherwise just throw the original error
                            throw error;
                        });
                    }
                    // If reject callback provided, just use it as-is
                    return originalThen.call(this, resolveCallback, rejectCallback);
                };

                return result;
            } catch (error: any) {
                // Direct synchronous errors (rare in Cypress but possible)
                if (error.message.includes('failed to find element') ||
                    error.message.includes('could not be found')) {
                    return handleHealingForSelector(error, selector, options, originalFn);
                }
                throw error;
            }
        };

        return wrappedFn();
    });

    // Similar override for the 'find' command
    Cypress.Commands.overwrite('find', (originalFn: any, subject: any, selector: string, options: any = {}) => {
        // Skip healing if disabled via environment variable
        if (Cypress.env('CYFIX_ENABLED') === false) {
            return originalFn(subject, selector);
        }

        // Create a wrapped version to handle errors
        const wrappedFn = () => {
            try {
                const result = originalFn(subject, selector);

                // Attach our own error handler to handle element not found errors
                const originalThen = result.then;
                result.then = function (resolveCallback: any, rejectCallback?: any) {
                    // If no reject callback provided, we'll add our healing logic
                    if (!rejectCallback) {
                        return originalThen.call(this, resolveCallback, (error: Error) => {
                            if (error.message.includes('failed to find element') ||
                                error.message.includes('could not be found')) {
                                // Attempt healing
                                return handleHealingForSubject(error, subject, selector, options, originalFn);
                            }
                            // Otherwise just throw the original error
                            throw error;
                        });
                    }
                    // If reject callback provided, just use it as-is
                    return originalThen.call(this, resolveCallback, rejectCallback);
                };

                return result;
            } catch (error: any) {
                // Direct synchronous errors (rare in Cypress but possible)
                if (error.message.includes('failed to find element') ||
                    error.message.includes('could not be found')) {
                    return handleHealingForSubject(error, subject, selector, options, originalFn);
                }
                throw error;
            }
        };

        return wrappedFn();
    });

    // Add a new command to manually capture baseline DOM snapshots
    Cypress.Commands.add('captureBaseline', (testId?: string) => {
        const domSnapshot = captureDOMSnapshot();

        // Collect all currently used selectors in the test
        // This is a simplistic approach - in a real implementation,
        // we would need a more sophisticated mechanism to track selectors
        const selectors: Record<string, string> = {};

        // Use the current test title as the ID if not provided
        const id = testId || Cypress.currentTest.title;

        return cy.task('captureBaseline', {
            testId: id,
            domSnapshot,
            selectors
        });
    });

    // Helper function to handle healing for a selector (used by 'get' command)
    function handleHealingForSelector(error: Error, selector: string, options: any, originalFn: any) {
        // Capture the current DOM state
        const domSnapshot = captureDOMSnapshot();

        // Call the healing task registered in the plugin
        return cy.task('healSelector', {
            originalSelector: selector,
            domSnapshot,
            context: {
                url: window.location.href,
                title: document.title
            }
        }, {log: false}).then((results: any) => {
            const healingResults = results as HealingResult[];

            if (healingResults.length > 0) {
                // Sort by score in descending order
                const sortedResults = [...healingResults].sort((a, b) => b.score - a.score);
                const bestMatch = sortedResults[0];

                // Log the healing information
                Cypress.log({
                    name: 'cyfix',
                    message: `Healed selector "${selector}" to "${bestMatch.selector}" (score: ${bestMatch.score.toFixed(2)})`,
                    consoleProps: () => ({
                        'Original Selector': selector,
                        'Healed Selector': bestMatch.selector,
                        'Strategy': bestMatch.strategy,
                        'Score': bestMatch.score,
                        'Source': bestMatch.source,
                        'All Candidates': sortedResults
                    })
                });

                // Try the healed selector
                return originalFn(bestMatch.selector, options);
            }

            // If no healing found, throw original error
            throw error;
        });
    }

    // Helper function to handle healing for a subject+selector (used by 'find' command)
    function handleHealingForSubject(error: Error, subject: any, selector: string, options: any, originalFn: any) {
        // Capture the current DOM state
        const domSnapshot = captureDOMSnapshot();

        // Call the healing task registered in the plugin
        return cy.task('healSelector', {
            originalSelector: selector,
            domSnapshot,
            context: {
                url: window.location.href,
                title: document.title
            }
        }, {log: false}).then((results: any) => {
            const healingResults = results as HealingResult[];

            if (healingResults.length > 0) {
                // Sort by score in descending order
                const sortedResults = [...healingResults].sort((a, b) => b.score - a.score);
                const bestMatch = sortedResults[0];

                // Log the healing information
                Cypress.log({
                    name: 'cyfix',
                    message: `Healed selector "${selector}" to "${bestMatch.selector}" (score: ${bestMatch.score.toFixed(2)})`,
                    consoleProps: () => ({
                        'Original Selector': selector,
                        'Healed Selector': bestMatch.selector,
                        'Strategy': bestMatch.strategy,
                        'Score': bestMatch.score,
                        'Source': bestMatch.source,
                        'All Candidates': sortedResults
                    })
                });

                // Try the healed selector
                return originalFn(subject, bestMatch.selector);
            }

            // If no healing found, throw original error
            throw error;
        });
    }
}

// Augment Cypress namespace to include our new command
declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Captures the current DOM state as a baseline for future healing
             * @param testId Optional identifier for the test
             */
            captureBaseline(testId?: string): Chainable<boolean>;
        }
    }
}