// CyFix Core - Main Entry Point
import {DOMNode, DOMSnapshot, HealingResult} from 'cyfix-types';
import {findCandidateElements} from './finder';
import {scoreElements} from './scorer';
import {generateSelectors} from './generator';

/**
 * Main healing function that attempts to find alternative selectors
 * for a broken selector in the current DOM.
 *
 * @param originalSelector The selector that failed to find elements
 * @param baseline The baseline DOM snapshot captured when the test was created/last updated
 * @param current The current DOM snapshot where the selector failed
 * @returns Array of healing results, sorted by confidence score (descending)
 */
export async function healSelector(
    originalSelector: string,
    baseline: DOMSnapshot,
    current: DOMSnapshot
): Promise<HealingResult[]> {
    try {
        // 1. Find the element in the baseline DOM that matches the original selector
        const baselineElement = findElementBySelector(baseline.rootNode, originalSelector);

        if (!baselineElement) {
            console.warn(`Could not find element matching "${originalSelector}" in baseline DOM`);
            return [];
        }

        // 2. Find candidate elements in the current DOM that might match
        const candidateElements = findCandidateElements(baselineElement, current.rootNode);

        if (candidateElements.length === 0) {
            console.warn(`No candidate elements found for "${originalSelector}"`);
            return [];
        }

        // 3. Score each candidate element based on similarity to the baseline element
        const scoredCandidates = scoreElements(baselineElement, candidateElements);

        // 4. Generate selectors for the top candidates
        const results: HealingResult[] = [];

        for (const candidate of scoredCandidates) {
            if (candidate.score < 0.3) {
                // Skip candidates with very low scores
                continue;
            }

            const selectors = generateSelectors(candidate.element, current.rootNode);

            // Add each selector as a healing result
            for (const selector of selectors) {
                results.push({
                    selector: selector.value,
                    score: candidate.score * selector.specificity, // Adjust score by selector specificity
                    strategy: selector.strategy,
                    source: 'local'
                });
            }
        }

        // 5. Sort results by score (descending)
        return results.sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error('Error in healSelector:', error);
        return [];
    }
}

/**
 * Simple function to find an element in the DOM by selector
 * This is a simplified implementation - in a real algorithm, we would
 * need to parse and execute different types of selectors (CSS, XPath, etc.)
 */
function findElementBySelector(rootNode: DOMNode, selector: string): DOMNode | null {
    // Very simple implementation that only handles ID selectors
    // In a real implementation, this would use a proper selector engine

    if (selector.startsWith('#')) {
        const id = selector.substring(1);
        return findElementById(rootNode, id);
    }

    // Placeholder for other selector types
    console.warn(`Selector type not implemented for "${selector}"`);
    return null;
}

/**
 * Finds an element by ID in the DOM tree
 */
function findElementById(node: DOMNode, id: string): DOMNode | null {
    if (node.id === id) {
        return node;
    }

    for (const child of node.children) {
        const found = findElementById(child, id);
        if (found) {
            return found;
        }
    }

    return null;
}

export {findCandidateElements} from './finder';
export {scoreElements} from './scorer';
export {generateSelectors} from './generator';
