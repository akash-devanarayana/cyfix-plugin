"use strict";
// Stats Routes
// Handles API endpoints for retrieving statistics about healing performance
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
const express_1 = __importDefault(require("express"));
function statsRouter(db) {
    const router = express_1.default.Router();
    /**
     * Get overall healing statistics
     * GET /api/stats/healing
     */
    router.get('/healing', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Get healing stats
            const stats = yield db.getHealingStats();
            return res.json(stats);
        }
        catch (error) {
            console.error('Error getting healing stats:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Get statistics about selectors
     * GET /api/stats/selectors
     */
    router.get('/selectors', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            // For now, return dummy data
            // In a real implementation, we would query the database
            return res.json({
                totalSelectors: 100,
                totalTests: 10,
                averageSelectorsPerTest: 10,
                topTests: [
                    { testId: 'login-test', selectorCount: 25 },
                    { testId: 'profile-test', selectorCount: 15 },
                    { testId: 'checkout-test', selectorCount: 12 }
                ]
            });
        }
        catch (error) {
            console.error('Error getting selector stats:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Get statistics about DOM snapshots
     * GET /api/stats/snapshots
     */
    router.get('/snapshots', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            // For now, return dummy data
            // In a real implementation, we would query the database
            return res.json({
                totalSnapshots: 50,
                totalTests: 10,
                averageSnapshotsPerTest: 5,
                latestSnapshots: [
                    { testId: 'login-test', timestamp: Date.now() - 3600000 },
                    { testId: 'profile-test', timestamp: Date.now() - 7200000 },
                    { testId: 'checkout-test', timestamp: Date.now() - 14400000 }
                ]
            });
        }
        catch (error) {
            console.error('Error getting snapshot stats:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Get detailed statistics for a specific test
     * GET /api/stats/test/:testId
     */
    router.get('/test/:testId', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { testId } = req.params;
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
                        { strategy: 'id-based', count: 3 },
                        { strategy: 'class-based', count: 2 },
                        { strategy: 'attribute', count: 2 },
                        { strategy: 'css-path', count: 1 }
                    ]
                }
            });
        }
        catch (error) {
            console.error('Error getting test stats:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    return router;
}
exports.statsRouter = statsRouter;
