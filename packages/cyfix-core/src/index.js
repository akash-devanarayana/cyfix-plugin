"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSelectors = exports.scoreElements = exports.findCandidateElements = exports.healSelector = void 0;
const finder_1 = require("./finder");
const scorer_1 = require("./scorer");
const generator_1 = require("./generator");
/**
 * Main healing function that attempts to find alternative selectors
 * for a broken selector in the current DOM.
 *
 * @param originalSelector The selector that failed to find elements
 * @param baseline The baseline DOM snapshot captured when the test was created/last updated
 * @param current The current DOM snapshot where the selector failed
 * @returns Array of healing results, sorted by confidence score (descending)
 */
function healSelector(originalSelector, baseline, current) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. Find the element in the baseline DOM that matches the original selector
            const baselineElement = findElementBySelector(baseline.rootNode, originalSelector);
            if (!baselineElement) {
                console.warn(`Could not find element matching "${originalSelector}" in baseline DOM`);
                return [];
            }
            // 2. Find candidate elements in the current DOM that might match
            const candidateElements = (0, finder_1.findCandidateElements)(baselineElement, current.rootNode);
            if (candidateElements.length === 0) {
                console.warn(`No candidate elements found for "${originalSelector}"`);
                return [];
            }
            // 3. Score each candidate element based on similarity to the baseline element
            const scoredCandidates = (0, scorer_1.scoreElements)(baselineElement, candidateElements);
            // 4. Generate selectors for the top candidates
            const results = [];
            for (const candidate of scoredCandidates) {
                if (candidate.score < 0.3) {
                    // Skip candidates with very low scores
                    continue;
                }
                const selectors = (0, generator_1.generateSelectors)(candidate.element, current.rootNode);
                // Add each selector as a healing result
                for (const selector of selectors) {
                    results.push({
                        selector: selector.value,
                        score: candidate.score * selector.specificity,
                        strategy: selector.strategy,
                        source: 'local'
                    });
                }
            }
            // 5. Sort results by score (descending)
            return results.sort((a, b) => b.score - a.score);
        }
        catch (error) {
            console.error('Error in healSelector:', error);
            return [];
        }
    });
}
exports.healSelector = healSelector;
/**
 * Simple function to find an element in the DOM by selector
 * This is a simplified implementation - in a real algorithm, we would
 * need to parse and execute different types of selectors (CSS, XPath, etc.)
 */
function findElementBySelector(rootNode, selector) {
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
function findElementById(node, id) {
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
var finder_2 = require("./finder");
Object.defineProperty(exports, "findCandidateElements", { enumerable: true, get: function () { return finder_2.findCandidateElements; } });
var scorer_2 = require("./scorer");
Object.defineProperty(exports, "scoreElements", { enumerable: true, get: function () { return scorer_2.scoreElements; } });
var generator_2 = require("./generator");
Object.defineProperty(exports, "generateSelectors", { enumerable: true, get: function () { return generator_2.generateSelectors; } });
