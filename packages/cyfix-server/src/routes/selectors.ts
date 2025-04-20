// Selectors Routes
// Handles API endpoints for storing and retrieving selectors

import express from 'express';
import { Database } from '../database';

export function selectorsRouter(db: Database): express.Router {
    const router = express.Router();

    /**
     * Store a selector
     * POST /api/selectors
     */
    router.post('/', async (req, res) => {
        try {
            const { testId, selector, domSnapshotId } = req.body;

            // Validate request
            if (!testId || !selector || !domSnapshotId) {
                return res.status(400).json({
                    error: 'Missing required fields: testId, selector, or domSnapshotId'
                });
            }

            // Store the selector
            const selectorId = await db.storeSelector(testId, selector, domSnapshotId);

            return res.status(201).json({
                id: selectorId,
                testId,
                selector,
                domSnapshotId,
                message: 'Selector stored successfully'
            });
        } catch (error: any) {
            console.error('Error storing selector:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Get all selectors for a test
     * GET /api/selectors/:testId
     */
    router.get('/:testId', async (req, res) => {
        try {
            const { testId } = req.params;

            // Get the selectors
            const selectors = await db.getSelectors(testId);

            if (selectors.length === 0) {
                return res.status(404).json({
                    error: `No selectors found for test: ${testId}`
                });
            }

            return res.json({
                testId,
                selectors,
                count: selectors.length
            });
        } catch (error: any) {
            console.error('Error retrieving selectors:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Delete a selector
     * DELETE /api/selectors/:id
     */
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // In a real implementation, we would delete the selector here
            // For now, just return a success message

            return res.json({
                id: parseInt(id),
                message: 'Selector deleted successfully'
            });
        } catch (error: any) {
            console.error('Error deleting selector:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Update a selector
     * PUT /api/selectors/:id
     */
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { selector } = req.body;

            if (!selector) {
                return res.status(400).json({
                    error: 'Missing required field: selector'
                });
            }

            // In a real implementation, we would update the selector here
            // For now, just return a success message

            return res.json({
                id: parseInt(id),
                selector,
                message: 'Selector updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating selector:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    return router;
}