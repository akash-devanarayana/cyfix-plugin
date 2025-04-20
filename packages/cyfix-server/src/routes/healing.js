"use strict";
// Healing Routes
// Handles API endpoints for healing selectors and managing healing records
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
exports.healingRouter = void 0;
const express_1 = __importDefault(require("express"));
const src_1 = require("../../../cyfix-core/src");
function healingRouter(db) {
    const router = express_1.default.Router();
    /**
     * Heal a selector
     * POST /api/healing/heal
     */
    router.post('/heal', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { originalSelector, domSnapshot, testId, context } = req.body;
            // Validate request
            if (!originalSelector || !domSnapshot) {
                return res.status(400).json({
                    error: 'Missing required fields: originalSelector or domSnapshot'
                });
            }
            let healingResults = [];
            // First, try to find existing successful healings for this selector
            if (context === null || context === void 0 ? void 0 : context.url) {
                const existingHealings = yield db.getHealingSuggestions(originalSelector, context.url);
                if (existingHealings.length > 0) {
                    // Convert existing healing records to healing results
                    healingResults = existingHealings.map(healing => ({
                        selector: healing.healed_selector,
                        score: healing.score,
                        strategy: healing.strategy,
                        source: 'server'
                    }));
                }
            }
            // If no existing healings found, try to heal with the algorithm
            if (healingResults.length === 0 && testId) {
                // Get the baseline DOM snapshot for this test
                const baselineRecord = yield db.getLatestDOMSnapshot(testId);
                if (baselineRecord) {
                    const baselineSnapshot = JSON.parse(baselineRecord.dom_data);
                    // Use the healing algorithm
                    const algorithmResults = yield (0, src_1.healSelector)(originalSelector, baselineSnapshot, domSnapshot);
                    // Add results from the algorithm
                    healingResults = algorithmResults.map(result => (Object.assign(Object.assign({}, result), { source: 'server' })));
                }
            }
            // If we still don't have any healing results, use the core algorithm
            // with just the current DOM (less effective, but worth a try)
            if (healingResults.length === 0) {
                // Create a dummy baseline with just the same structure
                // This is a fallback approach when we don't have a proper baseline
                const dummyBaseline = Object.assign(Object.assign({}, domSnapshot), { timestamp: Date.now() - 1000 // Make it a bit older
                 });
                // Use the healing algorithm with this dummy baseline
                const fallbackResults = yield (0, src_1.healSelector)(originalSelector, dummyBaseline, domSnapshot);
                // Add results from the fallback
                healingResults = fallbackResults.map(result => (Object.assign(Object.assign({}, result), { source: 'server', score: result.score * 0.8 // Reduce confidence for fallback results
                 })));
            }
            return res.json({
                originalSelector,
                results: healingResults,
                count: healingResults.length
            });
        }
        catch (error) {
            console.error('Error healing selector:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Report healing success or failure
     * POST /api/healing/report
     */
    router.post('/report', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { originalSelector, healedSelector, score, strategy, success, url, testId } = req.body;
            // Validate request
            if (!originalSelector || !healedSelector || score === undefined || !strategy || success === undefined || !url) {
                return res.status(400).json({
                    error: 'Missing required fields'
                });
            }
            // Store the healing record
            const recordId = yield db.storeHealingRecord(originalSelector, healedSelector, score, strategy, success, url, testId);
            return res.status(201).json({
                id: recordId,
                originalSelector,
                healedSelector,
                success,
                message: 'Healing report stored successfully'
            });
        }
        catch (error) {
            console.error('Error reporting healing:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Get healing suggestions for a selector
     * GET /api/healing/suggestions
     */
    router.get('/suggestions', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const originalSelector = req.query.selector;
            const url = req.query.url;
            if (!originalSelector) {
                return res.status(400).json({
                    error: 'Missing required query parameter: selector'
                });
            }
            // Get healing suggestions
            const suggestions = yield db.getHealingSuggestions(originalSelector, url);
            return res.json({
                originalSelector,
                url,
                suggestions,
                count: suggestions.length
            });
        }
        catch (error) {
            console.error('Error getting healing suggestions:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    return router;
}
exports.healingRouter = healingRouter;
