// Selector Generator
// Responsible for generating alternative selectors for candidate elements

import {DOMNode, HealingStrategy} from '../../cyfix-plugin/src/types';

/**
 * Interface representing a generated selector
 */
export interface GeneratedSelector {
    value: string;
    strategy: HealingStrategy;
    specificity: number; // How specific/unique the selector is (0-1)
}

/**
 * Generates alternative selectors for a candidate element
 *
 * @param element The element to generate selectors for
 * @param rootNode The root node of the DOM tree
 * @returns Array of generated selectors
 */
export function generateSelectors(
    element: DOMNode,
    rootNode: DOMNode
): GeneratedSelector[] {
    const selectors: GeneratedSelector[] = [];

    // 1. ID-based selector (highest priority if available)
    if (element.id) {
        selectors.push({
            value: `#${element.id}`,
            strategy: 'id-based',
            specificity: 1.0
        });
    }

    // 2. Class-based selectors
    if (element.className) {
        const classes = element.className.split(/\s+/).filter(Boolean);

        if (classes.length > 0) {
            // Try with all classes combined (more specific)
            const combinedClassSelector = `.${classes.join('.')}`;

            // Check how many elements this selector would match
            const combinedSpecificity = estimateSelectorSpecificity(combinedClassSelector, rootNode);

            selectors.push({
                value: combinedClassSelector,
                strategy: 'class-based',
                specificity: combinedSpecificity
            });

            // If there are multiple classes, also try with individual classes
            if (classes.length > 1) {
                for (const cls of classes) {
                    // Skip very common classes that would match too many elements
                    if (isCommonClass(cls)) continue;

                    const singleClassSelector = `.${cls}`;
                    const specificity = estimateSelectorSpecificity(singleClassSelector, rootNode);

                    // Only add if it's reasonably specific
                    if (specificity > 0.5) {
                        selectors.push({
                            value: singleClassSelector,
                            strategy: 'class-based',
                            specificity
                        });
                    }
                }
            }
        }
    }

    // 3. Attribute-based selectors
    for (const [name, value] of Object.entries(element.attributes)) {
        // Skip id and class as we already handled them
        if (name === 'id' || name === 'class') continue;

        // Focus on attributes that are likely to be stable and unique
        if (isGoodSelectorAttribute(name)) {
            const attributeSelector = `[${name}="${value}"]`;
            const specificity = estimateSelectorSpecificity(attributeSelector, rootNode);

            if (specificity > 0.7) {
                selectors.push({
                    value: attributeSelector,
                    strategy: 'attribute',
                    specificity
                });
            }
        }
    }

    // 4. Tag with attributes (combination selectors)
    // These are more robust than just attributes but less specific than ID

    // Tag with attribute selectors
    for (const [name, value] of Object.entries(element.attributes)) {
        if (name === 'id' || name === 'class') continue;

        if (isGoodSelectorAttribute(name)) {
            const tagAttributeSelector = `${element.tagName}[${name}="${value}"]`;
            const specificity = estimateSelectorSpecificity(tagAttributeSelector, rootNode);

            if (specificity > 0.8) {
                selectors.push({
                    value: tagAttributeSelector,
                    strategy: 'attribute',
                    specificity
                });
            }
        }
    }

    // Tag with class selector
    if (element.className) {
        const classes = element.className.split(/\s+/).filter(Boolean);

        if (classes.length > 0) {
            // Use the most distinguishing class
            let bestClass = classes[0];
            let bestSpecificity = 0;

            for (const cls of classes) {
                const specificity = estimateSelectorSpecificity(`.${cls}`, rootNode);
                if (specificity > bestSpecificity) {
                    bestSpecificity = specificity;
                    bestClass = cls;
                }
            }

            const tagClassSelector = `${element.tagName}.${bestClass}`;
            const specificity = estimateSelectorSpecificity(tagClassSelector, rootNode);

            selectors.push({
                value: tagClassSelector,
                strategy: 'class-based',
                specificity
            });
        }
    }

    // 5. Text-based selectors (for elements with distinctive text)
    if (element.textContent && element.textContent.length > 0 && element.textContent.length < 100) {
        // For elements with short, distinctive text content
        const text = element.textContent.trim();

        // Use exact text for very short content
        if (text.length < 30) {
            const textSelector = `${element.tagName}:contains("${text}")`;
            const specificity = estimateSelectorSpecificity(textSelector, rootNode);

            selectors.push({
                value: textSelector,
                strategy: 'text-based',
                specificity: specificity * 0.9 // Slightly reduce confidence in text-based selectors
            });
        }
        // For longer text, use a substring
        else {
            const shorterText = text.substring(0, 30);
            const textSelector = `${element.tagName}:contains("${shorterText}")`;
            const specificity = estimateSelectorSpecificity(textSelector, rootNode);

            selectors.push({
                value: textSelector,
                strategy: 'text-based',
                specificity: specificity * 0.8 // Reduce confidence further for partial text
            });
        }
    }

    // 6. CSS Path (full path from a distinctive ancestor)
    // This is a fallback for elements that don't have other good selectors
    const cssPath = generateCssPath(element, rootNode);
    selectors.push({
        value: cssPath,
        strategy: 'css-path',
        specificity: 0.7 // CSS Paths are less preferred as they're more brittle
    });

    // 7. XPath (absolute path)
    // Least preferred as it's the most brittle
    const xpath = generateXPath(element, rootNode);
    selectors.push({
        value: xpath,
        strategy: 'xpath',
        specificity: 0.6
    });

    // Remove duplicates and sort by specificity
    return removeDuplicateSelectors(selectors)
        .sort((a, b) => b.specificity - a.specificity);
}

/**
 * Checks if an attribute is good to use in a selector
 */
function isGoodSelectorAttribute(attributeName: string): boolean {
    const goodAttributes = [
        'name', 'data-testid', 'data-cy', 'data-test', 'data-automation',
        'aria-label', 'role', 'title', 'alt', 'href', 'src', 'type',
        'placeholder', 'value', 'for'
    ];

    return goodAttributes.includes(attributeName) ||
        attributeName.startsWith('data-');
}

/**
 * Checks if a class is too common to be useful in a selector
 */
function isCommonClass(className: string): boolean {
    const commonClasses = [
        'active', 'disabled', 'selected', 'hidden', 'visible',
        'container', 'wrapper', 'row', 'col', 'item',
        'btn', 'button', 'input', 'form', 'header', 'footer',
        'content', 'panel', 'card', 'modal', 'dialog',
        'text', 'title', 'label', 'icon', 'image',
        'large', 'small', 'medium', 'primary', 'secondary',
        'success', 'error', 'warning', 'info'
    ];

    return commonClasses.includes(className.toLowerCase());
}

/**
 * Estimates how specific/unique a selector is in the given DOM
 * Returns a value between 0 and 1, where 1 means the selector uniquely identifies one element
 */
function estimateSelectorSpecificity(selector: string, rootNode: DOMNode): number {
    // In a real implementation, we would properly evaluate the selector
    // against the DOM tree to count matches. This is a simplified version.

    // For now, just return a hard-coded estimate based on selector type
    if (selector.startsWith('#')) {
        return 1.0; // ID selectors are usually unique
    } else if (selector.includes('[data-testid=') || selector.includes('[data-cy=')) {
        return 0.95; // Test-specific attributes are usually unique
    } else if (selector.includes('[data-')) {
        return 0.9;  // Other data attributes are often unique
    } else if (selector.includes('[name=') || selector.includes('[role=')) {
        return 0.85; // Name and role attributes can be specific
    } else if (selector.startsWith('//')) {
        return 0.8;  // XPath can be quite specific
    } else if (selector.includes('.') && selector.includes('[')) {
        return 0.85; // Tag with class and attribute is usually specific
    } else if (selector.includes(':contains(')) {
        return 0.75; // Text-based selectors depend on the text
    } else if (selector.includes('.') && selector.match(/\./g)?.length! > 1) {
        return 0.8;  // Multiple classes are often specific
    } else if (selector.includes('[') && selector.includes('=')) {
        return 0.75; // Attribute selectors can be specific
    } else if (selector.includes(' > ')) {
        return 0.7;  // Direct child selectors add specificity
    } else if (selector.includes(' ')) {
        return 0.65; // Descendant selectors add some specificity
    } else if (selector.includes('.')) {
        return 0.6;  // Single class selectors may match multiple elements
    } else {
        return 0.5;  // Tag selectors are very general
    }
}

/**
 * Generates a CSS path for an element
 * This is a simplified implementation - a real one would be more sophisticated
 */
function generateCssPath(element: DOMNode, rootNode: DOMNode): string {
    // For simplicity, use tag name with id, class, or position
    let selector = element.tagName;

    if (element.id) {
        selector += `#${element.id}`;
    } else if (element.className) {
        const classes = element.className.split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
            // Use the most distinctive class
            let bestClass = classes[0];

            // In a real implementation, we would analyze all classes to find the most unique one
            selector += `.${bestClass}`;
        } else {
            // Fallback to position if no class is available
            selector += `:nth-child(2)`;  // Dummy value for this example
        }
    } else {
        // Fallback to position if no id or class is available
        selector += `:nth-child(2)`;  // Dummy value for this example
    }

    return selector;
}

/**
 * Generates an XPath for an element
 * This is a simplified implementation - a real one would be more sophisticated
 */
function generateXPath(element: DOMNode, rootNode: DOMNode): string {
    // For simplicity, just create a basic XPath
    // In a real implementation, we would build a path from the element to the root

    let xpath = `//${element.tagName}`;

    if (element.id) {
        xpath += `[@id="${element.id}"]`;
    } else if (element.className) {
        const classes = element.className.split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
            xpath += `[contains(@class, "${classes[0]}")]`;
        }
    } else if (element.textContent) {
        const text = element.textContent.trim();
        if (text.length < 30) {
            xpath += `[text()="${text}"]`;
        } else {
            xpath += `[contains(text(), "${text.substring(0, 30)}")]`;
        }
    }

    return xpath;
}

/**
 * Removes duplicate selectors from the array
 */
function removeDuplicateSelectors(selectors: GeneratedSelector[]): GeneratedSelector[] {
    const uniqueSelectors = new Map<string, GeneratedSelector>();

    for (const selector of selectors) {
        if (!uniqueSelectors.has(selector.value) ||
            uniqueSelectors.get(selector.value)!.specificity < selector.specificity) {
            uniqueSelectors.set(selector.value, selector);
        }
    }

    return Array.from(uniqueSelectors.values());
}