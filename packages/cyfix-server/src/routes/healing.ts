// Healing Routes
// Handles API endpoints for healing selectors and managing healing records

import express from 'express';
import { Database } from '../database';
import { healSelector } from '../../../cyfix-core/src';
import { DOMSnapshot, HealingResult } from '../../../cyfix-plugin/src/types';

export function healingRouter(db: Database): express.Router {
    const router = express.Router();

    /**
     * Heal a selector
     * POST /api/healing/heal
     */
    router.post('/heal', async (req, res) => {
        try {
            const {
                originalSelector,
                domSnapshot,
                testId,
                context
            } = req.body;

            // Validate request
            if (!originalSelector || !domSnapshot) {
                return res.status(400).json({
                    error: 'Missing required fields: originalSelector or domSnapshot'
                });
            }

            let healingResults: HealingResult[] = [];

            // First, try to find existing successful healings for this selector
            if (context?.url) {
                const existingHealings = await db.getHealingSuggestions(
                    originalSelector,
                    context.url
                );

                if (existingHealings.length > 0) {
                    // Convert existing healing records to healing results
                    healingResults = existingHealings.map(healing => ({
                        selector: healing.healed_selector,
                        score: healing.score,
                        strategy: healing.strategy as any, // Type conversion
                        source: 'server'
                    }));
                }
            }

            // If no existing healings found, try to heal with the algorithm
            if (healingResults.length === 0 && testId) {
                // Get the baseline DOM snapshot for this test
                const baselineRecord = await db.getLatestDOMSnapshot(testId);

                if (baselineRecord) {
                    const baselineSnapshot: DOMSnapshot = JSON.parse(baselineRecord.dom_data);

                    // Use the healing algorithm
                    const algorithmResults = await healSelector(
                        originalSelector,
                        baselineSnapshot,
                        domSnapshot
                    );

                    // Add results from the algorithm
                    healingResults = algorithmResults.map(result => ({
                        ...result,
                        source: 'server'
                    }));
                }
            }

            // If we still don't have any healing results, use the core algorithm
            // with just the current DOM (less effective, but worth a try)
            if (healingResults.length === 0) {
                // Create a dummy baseline with just the same structure
                // This is a fallback approach when we don't have a proper baseline
                const dummyBaseline: DOMSnapshot = {
                    ...domSnapshot,
                    timestamp: Date.now() - 1000 // Make it a bit older
                };

                // Use the healing algorithm with this dummy baseline
                const fallbackResults = await healSelector(
                    originalSelector,
                    dummyBaseline,
                    domSnapshot
                );

                // Add results from the fallback
                healingResults = fallbackResults.map(result => ({
                    ...result,
                    source: 'server',
                    score: result.score * 0.8 // Reduce confidence for fallback results
                }));
            }

            return res.json({
                originalSelector,
                results: healingResults,
                count: healingResults.length
            });
        } catch (error: any) {
            console.error('Error healing selector:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Report healing success or failure
     * POST /api/healing/report
     */
    router.post('/report', async (req, res) => {
        try {
            const {
                originalSelector,
                healedSelector,
                score,
                strategy,
                success,
                url,
                testId
            } = req.body;

            // Validate request
            if (!originalSelector || !healedSelector || score === undefined || !strategy || success === undefined || !url) {
                return res.status(400).json({
                    error: 'Missing required fields'
                });
            }

            // Store the healing record
            const recordId = await db.storeHealingRecord(
                originalSelector,
                healedSelector,
                score,
                strategy,
                success,
                url,
                testId
            );

            return res.status(201).json({
                id: recordId,
                originalSelector,
                healedSelector,
                success,
                message: 'Healing report stored successfully'
            });
        } catch (error: any) {
            console.error('Error reporting healing:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Get healing suggestions for a selector
     * GET /api/healing/suggestions
     */
    router.get('/suggestions', async (req, res) => {
        try {
            const originalSelector = req.query.selector as string;
            const url = req.query.url as string | undefined;

            if (!originalSelector) {
                return res.status(400).json({
                    error: 'Missing required query parameter: selector'
                });
            }

            // Get healing suggestions
            const suggestions = await db.getHealingSuggestions(originalSelector, url);

            return res.json({
                originalSelector,
                url,
                suggestions,
                count: suggestions.length
            });
        } catch (error: any) {
            console.error('Error getting healing suggestions:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    return router;
}