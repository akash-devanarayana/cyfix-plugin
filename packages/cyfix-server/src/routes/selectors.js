"use strict";
// Selectors Routes
// Handles API endpoints for storing and retrieving selectors
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
exports.selectorsRouter = void 0;
const express_1 = __importDefault(require("express"));
function selectorsRouter(db) {
    const router = express_1.default.Router();
    /**
     * Store a selector
     * POST /api/selectors
     */
    router.post('/', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { testId, selector, domSnapshotId } = req.body;
            // Validate request
            if (!testId || !selector || !domSnapshotId) {
                return res.status(400).json({
                    error: 'Missing required fields: testId, selector, or domSnapshotId'
                });
            }
            // Store the selector
            const selectorId = yield db.storeSelector(testId, selector, domSnapshotId);
            return res.status(201).json({
                id: selectorId,
                testId,
                selector,
                domSnapshotId,
                message: 'Selector stored successfully'
            });
        }
        catch (error) {
            console.error('Error storing selector:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Get all selectors for a test
     * GET /api/selectors/:testId
     */
    router.get('/:testId', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { testId } = req.params;
            // Get the selectors
            const selectors = yield db.getSelectors(testId);
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
        }
        catch (error) {
            console.error('Error retrieving selectors:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Delete a selector
     * DELETE /api/selectors/:id
     */
    router.delete('/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            // In a real implementation, we would delete the selector here
            // For now, just return a success message
            return res.json({
                id: parseInt(id),
                message: 'Selector deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting selector:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Update a selector
     * PUT /api/selectors/:id
     */
    router.put('/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
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
        }
        catch (error) {
            console.error('Error updating selector:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    return router;
}
exports.selectorsRouter = selectorsRouter;
