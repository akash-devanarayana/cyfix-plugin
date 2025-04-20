// Element Finder
// Responsible for finding candidate elements in the current DOM that might
// match an element from the baseline DOM

import {DOMNode} from '../../cyfix-plugin/src/types';

/**
 * Interface representing a feature of a DOM element that can be used
 * for comparison and matching
 */
export interface ElementFeature {
    type: string;
    value: string;
    weight: number;
}

/**
 * Finds candidate elements in the current DOM that might match
 * the baseline element.
 *
 * @param baselineElement The element from the baseline DOM
 * @param currentRoot The root node of the current DOM
 * @returns Array of candidate elements that might match
 */
export function findCandidateElements(
    baselineElement: DOMNode,
    currentRoot: DOMNode
): DOMNode[] {
    // Extract features from the baseline element
    const features = extractFeatures(baselineElement);

    // Find all elements in the current DOM that match the basic features
    return findElementsByFeatures(currentRoot, features, baselineElement.tagName);
}

/**
 * Extracts key features from a DOM element that can be used for matching
 */
function extractFeatures(element: DOMNode): ElementFeature[] {
    const features: ElementFeature[] = [];

    // ID is a very strong feature
    if (element.id) {
        features.push({
            type: 'id',
            value: element.id,
            weight: 1.0
        });
    }

    // Class names are good features
    if (element.className) {
        const classes = element.className.split(/\s+/).filter(Boolean);
        for (const cls of classes) {
            features.push({
                type: 'class',
                value: cls,
                weight: 0.7
            });
        }
    }

    // Text content can be a good feature
    if (element.textContent) {
        features.push({
            type: 'text',
            value: element.textContent,
            weight: 0.6
        });
    }

    // Other attributes can also be useful features
    for (const [name, value] of Object.entries(element.attributes)) {
        // Skip id and class as they're already handled
        if (name === 'id' || name === 'class') continue;

        // Some attributes are more useful than others
        const weight = getAttributeWeight(name);

        features.push({
            type: 'attribute',
            value: `${name}="${value}"`,
            weight
        });
    }

    return features;
}

/**
 * Assigns a weight to different attribute types based on their
 * usefulness for matching elements
 */
function getAttributeWeight(attributeName: string): number {
    switch (attributeName.toLowerCase()) {
        case 'name':
        case 'data-testid':
        case 'data-cy':
        case 'data-test':
            return 0.8; // Testing-specific attributes are very reliable

        case 'href':
        case 'src':
        case 'alt':
        case 'title':
        case 'aria-label':
            return 0.7; // Semantic attributes are quite reliable

        case 'type':
        case 'role':
        case 'placeholder':
        case 'value':
            return 0.6; // Form-related attributes

        default:
            // Check if it's a data attribute
            if (attributeName.startsWith('data-')) {
                return 0.5;
            }

            // Other attributes are less reliable
            return 0.3;
    }
}

/**
 * Finds elements in the current DOM that match the specified features
 */
function findElementsByFeatures(
    rootNode: DOMNode,
    features: ElementFeature[],
    tagName: string
): DOMNode[] {
    const candidates: DOMNode[] = [];

    // Helper function to recursively find matching elements
    function findRecursive(node: DOMNode) {
        // Check if this node is a potential match
        if (node.tagName === tagName) {
            // Check if it matches any of the key features
            const matchCount = countFeatureMatches(node, features);

            // If it matches at least one feature, consider it a candidate
            if (matchCount > 0) {
                candidates.push(node);
            }
        }

        // Check children recursively
        for (const child of node.children) {
            findRecursive(child);
        }
    }

    // Start recursive search from root
    findRecursive(rootNode);

    return candidates;
}

/**
 * Counts how many features match between a node and a set of features
 */
function countFeatureMatches(node: DOMNode, features: ElementFeature[]): number {
    let matchCount = 0;

    for (const feature of features) {
        switch (feature.type) {
            case 'id':
                if (node.id === feature.value) {
                    matchCount += feature.weight;
                }
                break;

            case 'class':
                if (node.className && node.className.split(/\s+/).includes(feature.value)) {
                    matchCount += feature.weight;
                }
                break;

            case 'text':
                if (node.textContent && node.textContent.includes(feature.value)) {
                    matchCount += feature.weight;
                }
                break;

            case 'attribute': {
                const [name, value] = feature.value.split('=');
                const attrName = name;
                const attrValue = value ? value.replace(/^"|"$/g, '') : '';

                if (node.attributes[attrName] === attrValue) {
                    matchCount += feature.weight;
                }
                break;
            }
        }
    }

    return matchCount;
}