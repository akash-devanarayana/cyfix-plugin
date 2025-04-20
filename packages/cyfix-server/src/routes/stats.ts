// Stats Routes
// Handles API endpoints for retrieving statistics about healing performance

import express from 'express';
import {Database} from '../database';

export function statsRouter(db: Database): express.Router {
    const router = express.Router();

    /**
     * Get overall healing statistics
     * GET /api/stats/healing
     */
    router.get('/healing', async (req, res) => {
        try {
            // Get healing stats
            const stats = await db.getHealingStats();

            return res.json(stats);
        } catch (error: any) {
            console.error('Error getting healing stats:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Get statistics about selectors
     * GET /api/stats/selectors
     */
    router.get('/selectors', async (req, res) => {
        try {
            // For now, return dummy data
            // In a real implementation, we would query the database

            return res.json({
                totalSelectors: 100,
                totalTests: 10,
                averageSelectorsPerTest: 10,
                topTests: [
                    {testId: 'login-test', selectorCount: 25},
                    {testId: 'profile-test', selectorCount: 15},
                    {testId: 'checkout-test', selectorCount: 12}
                ]
            });
        } catch (error: any) {
            console.error('Error getting selector stats:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Get statistics about DOM snapshots
     * GET /api/stats/snapshots
     */
    router.get('/snapshots', async (req, res) => {
        try {
            // For now, return dummy data
            // In a real implementation, we would query the database

            return res.json({
                totalSnapshots: 50,
                totalTests: 10,
                averageSnapshotsPerTest: 5,
                latestSnapshots: [
                    {testId: 'login-test', timestamp: Date.now() - 3600000},
                    {testId: 'profile-test', timestamp: Date.now() - 7200000},
                    {testId: 'checkout-test', timestamp: Date.now() - 14400000}
                ]
            });
        } catch (error: any) {
            console.error('Error getting snapshot stats:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    /**
     * Get detailed statistics for a specific test
     * GET /api/stats/test/:testId
     */
    router.get('/test/:testId', async (req, res) => {
        try {
            const {testId} = req.params;

            // For now, return dummy data
            // In a real implementation, we would query the database

            return res.json({
                testId,
                selectorCount: 25,
                snapshotCount: 5,
                latestSnapshot: Date.now() - 3600000,
                healingStats: {
                    total: 10,
                    successful: 8,
                    successRate: 0.8,
                    byStrategy: [
                        {strategy: 'id-based', count: 3},
                        {strategy: 'class-based', count: 2},
                        {strategy: 'attribute', count: 2},
                        {strategy: 'css-path', count: 1}
                    ]
                }
            });
        } catch (error: any) {
            console.error('Error getting test stats:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    });

    return router;
}