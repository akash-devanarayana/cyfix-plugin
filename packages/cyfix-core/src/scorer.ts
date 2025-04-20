// Element Scorer
// Responsible for scoring candidate elements based on their similarity
// to the baseline element

import {DOMNode} from 'cyfix-types';

/**
 * Interface representing a scored candidate element
 */
export interface ScoredCandidate {
    element: DOMNode;
    score: number;
    matchedFeatures: string[];
}

/**
 * Scores candidate elements based on their similarity to the baseline element
 *
 * @param baselineElement The element from the baseline DOM
 * @param candidateElements Array of candidate elements from the current DOM
 * @returns Array of scored candidates, sorted by score (descending)
 */
export function scoreElements(
    baselineElement: DOMNode,
    candidateElements: DOMNode[]
): ScoredCandidate[] {
    // Score each candidate element
    const scoredCandidates: ScoredCandidate[] = candidateElements.map(element => {
        const {score, matchedFeatures} = calculateSimilarityScore(baselineElement, element);
        return {element, score, matchedFeatures};
    });

    // Sort by score (descending)
    return scoredCandidates.sort((a, b) => b.score - a.score);
}

/**
 * Calculates a similarity score between two DOM elements
 * Returns a score between 0 and 1, where 1 means perfect match
 */
function calculateSimilarityScore(
    baselineElement: DOMNode,
    candidateElement: DOMNode
): { score: number; matchedFeatures: string[] } {
    const matchedFeatures: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    // 1. Compare tag name (fundamental requirement)
    if (baselineElement.tagName !== candidateElement.tagName) {
        return {score: 0, matchedFeatures: []};
    } else {
        matchedFeatures.push(`tag:${baselineElement.tagName}`);
        totalScore += 10;
    }
    maxPossibleScore += 10;

    // 2. Compare ID (very strong match if present)
    if (baselineElement.id) {
        maxPossibleScore += 30;
        if (baselineElement.id === candidateElement.id) {
            matchedFeatures.push(`id:${baselineElement.id}`);
            totalScore += 30;
        }
    }

    // 3. Compare classes
    const baselineClasses = baselineElement.className ?
        new Set(baselineElement.className.split(/\s+/).filter(Boolean)) :
        new Set<string>();

    const candidateClasses = candidateElement.className ?
        new Set(candidateElement.className.split(/\s+/).filter(Boolean)) :
        new Set<string>();

    if (baselineClasses.size > 0) {
        maxPossibleScore += 20;

        // Calculate class overlap
        let matchedClassCount = 0;
        for (const cls of baselineClasses) {
            if (candidateClasses.has(cls)) {
                matchedClassCount++;
                matchedFeatures.push(`class:${cls}`);
            }
        }

        const classScore = (matchedClassCount / baselineClasses.size) * 20;
        totalScore += classScore;
    }

    // 4. Compare text content
    if (baselineElement.textContent) {
        maxPossibleScore += 15;

        if (candidateElement.textContent) {
            // Calculate text similarity
            const textSimilarity = calculateTextSimilarity(
                baselineElement.textContent,
                candidateElement.textContent
            );

            if (textSimilarity > 0.8) {
                matchedFeatures.push('text:similar');
                totalScore += 15 * textSimilarity;
            } else if (textSimilarity > 0.5) {
                matchedFeatures.push('text:partial');
                totalScore += 10 * textSimilarity;
            }
        }
    }

    // 5. Compare attributes
    const baselineAttrs = baselineElement.attributes || {};
    const candidateAttrs = candidateElement.attributes || {};

    // Count important attributes (excluding id and class which we already checked)
    const importantAttrs = [
        'name', 'data-testid', 'data-cy', 'data-test', 'href', 'src',
        'alt', 'title', 'aria-label', 'type', 'role', 'placeholder', 'value'
    ];

    for (const attr of importantAttrs) {
        if (baselineAttrs[attr]) {
            maxPossibleScore += 10;

            if (baselineAttrs[attr] === candidateAttrs[attr]) {
                matchedFeatures.push(`attr:${attr}`);
                totalScore += 10;
            }
        }
    }

    // Check other attributes
    for (const [key, value] of Object.entries(baselineAttrs)) {
        // Skip attributes we've already checked
        if (importantAttrs.includes(key) || key === 'id' || key === 'class') {
            continue;
        }

        maxPossibleScore += 5;

        if (candidateAttrs[key] === value) {
            matchedFeatures.push(`attr:${key}`);
            totalScore += 5;
        }
    }

    // 6. Compare DOM structure (position relative to siblings)
    // This is a simplified approach - a real implementation would be more sophisticated
    maxPossibleScore += 10;

    // For now, we just check if the element has a similar number of siblings
    const baselineParentChildrenCount = baselineElement.children.length;
    const candidateParentChildrenCount = candidateElement.children.length;

    if (Math.abs(baselineParentChildrenCount - candidateParentChildrenCount) <= 2) {
        matchedFeatures.push('structure:similar-children-count');
        totalScore += 5;
    }

    // Calculate final score (normalized between 0 and 1)
    const normalizedScore = maxPossibleScore > 0 ?
        totalScore / maxPossibleScore : 0;

    return {
        score: normalizedScore,
        matchedFeatures
    };
}

/**
 * Calculates similarity between two text strings
 * Returns a score between 0 and 1
 */
function calculateTextSimilarity(text1: string, text2: string): number {
    // Simple implementation using Jaccard similarity of words
    // For a real implementation, consider using more sophisticated algorithms
    // like Levenshtein distance or cosine similarity

    // Normalize and tokenize texts
    const words1 = text1.toLowerCase().trim().split(/\s+/);
    const words2 = text2.toLowerCase().trim().split(/\s+/);

    // Convert to sets
    const set1 = new Set(words1);
    const set2 = new Set(words2);

    // Calculate Jaccard similarity: intersection size / union size
    const intersectionSize = [...set1].filter(word => set2.has(word)).length;
    const unionSize = new Set([...set1, ...set2]).size;

    return unionSize === 0 ? 0 : intersectionSize / unionSize;
}
