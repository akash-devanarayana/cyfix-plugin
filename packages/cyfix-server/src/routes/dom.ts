// DOM Routes
// Handles API endpoints for storing and retrieving DOM snapshots

import express from 'express';
import { Database } from '../database';
import { DOMSnapshot } from '../../../cyfix-plugin/src/types';

export function domRouter(db: Database): express.Router {
    const router = express.Router();

    /**
     * Store a DOM snapshot
     * POST /api/dom/snapshot
     */
    router.post('/snapshot', async (req, res) => {
        try {
            const { testId, snapshot } = req.body;

            // Validate request
            if (!testId || !snapshot) {
                return res.status(400).json({
                    error: 'Missing required fields: testId or snapshot'
                });
            }

            // Ensure snapshot has required fields
            if (!snapshot.url || !snapshot.rootNode) {
                return res.status(400).json({
                    error: 'Invalid snapshot format: missing url or rootNode'
                });
            }

            // Add timestamp if not provided
            if (!snapshot.timestamp) {
                snapshot.timestamp = Date.now();
            }

            // Store the snapshot
            const snapshotId = await db.storeDOMSnapshot(testId, snapshot);

            return res.status(201).json({
                id: snapshotId,
                testId,
                timestamp: snapshot.timestamp,
                message: 'DOM snapshot stored successfully'
            });
        } catch (error: any) {
            console.error('Error storing DOM snapshot:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Get the latest DOM snapshot for a test
     * GET /api/dom/snapshot/:testId
     */
    router.get('/snapshot/:testId', async (req, res) => {
        try {
            const { testId } = req.params;

            // Get the snapshot
            const snapshot = await db.getLatestDOMSnapshot(testId);

            if (!snapshot) {
                return res.status(404).json({
                    error: `No DOM snapshot found for test: ${testId}`
                });
            }

            // Parse the DOM data
            const domData: DOMSnapshot = JSON.parse(snapshot.dom_data);

            return res.json({
                id: snapshot.id,
                testId: snapshot.test_id,
                url: snapshot.url,
                title: snapshot.title,
                timestamp: snapshot.timestamp,
                snapshot: domData
            });
        } catch (error: any) {
            console.error('Error retrieving DOM snapshot:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Store baseline DOM and selectors together
     * POST /api/dom/baseline
     */
    router.post('/baseline', async (req, res) => {
        try {
            const { testId, snapshot, selectors } = req.body;

            // Validate request
            if (!testId || !snapshot || !selectors) {
                return res.status(400).json({
                    error: 'Missing required fields: testId, snapshot, or selectors'
                });
            }

            // Store the snapshot
            const snapshotId = await db.storeDOMSnapshot(testId, snapshot);

            // Store each selector
            const storedSelectors = [];
            for (const [key, selector] of Object.entries(selectors)) {
                const selectorId = await db.storeSelector(
                    testId,
                    selector as string,
                    snapshotId
                );
                storedSelectors.push({ key, selector, id: selectorId });
            }

            return res.status(201).json({
                id: snapshotId,
                testId,
                timestamp: snapshot.timestamp,
                selectorCount: storedSelectors.length,
                message: 'Baseline stored successfully'
            });
        } catch (error: any) {
            console.error('Error storing baseline:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    return router;
}