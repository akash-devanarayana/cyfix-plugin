"use strict";
// DOM Routes
// Handles API endpoints for storing and retrieving DOM snapshots
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
exports.domRouter = void 0;
const express_1 = __importDefault(require("express"));
function domRouter(db) {
    const router = express_1.default.Router();
    /**
     * Store a DOM snapshot
     * POST /api/dom/snapshot
     */
    router.post('/snapshot', (req, res) => __awaiter(this, void 0, void 0, function* () {
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
            const snapshotId = yield db.storeDOMSnapshot(testId, snapshot);
            return res.status(201).json({
                id: snapshotId,
                testId,
                timestamp: snapshot.timestamp,
                message: 'DOM snapshot stored successfully'
            });
        }
        catch (error) {
            console.error('Error storing DOM snapshot:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Get the latest DOM snapshot for a test
     * GET /api/dom/snapshot/:testId
     */
    router.get('/snapshot/:testId', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { testId } = req.params;
            // Get the snapshot
            const snapshot = yield db.getLatestDOMSnapshot(testId);
            if (!snapshot) {
                return res.status(404).json({
                    error: `No DOM snapshot found for test: ${testId}`
                });
            }
            // Parse the DOM data
            const domData = JSON.parse(snapshot.dom_data);
            return res.json({
                id: snapshot.id,
                testId: snapshot.test_id,
                url: snapshot.url,
                title: snapshot.title,
                timestamp: snapshot.timestamp,
                snapshot: domData
            });
        }
        catch (error) {
            console.error('Error retrieving DOM snapshot:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    /**
     * Store baseline DOM and selectors together
     * POST /api/dom/baseline
     */
    router.post('/baseline', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { testId, snapshot, selectors } = req.body;
            // Validate request
            if (!testId || !snapshot || !selectors) {
                return res.status(400).json({
                    error: 'Missing required fields: testId, snapshot, or selectors'
                });
            }
            // Store the snapshot
            const snapshotId = yield db.storeDOMSnapshot(testId, snapshot);
            // Store each selector
            const storedSelectors = [];
            for (const [key, selector] of Object.entries(selectors)) {
                const selectorId = yield db.storeSelector(testId, selector, snapshotId);
                storedSelectors.push({ key, selector, id: selectorId });
            }
            return res.status(201).json({
                id: snapshotId,
                testId,
                timestamp: snapshot.timestamp,
                selectorCount: storedSelectors.length,
                message: 'Baseline stored successfully'
            });
        }
        catch (error) {
            console.error('Error storing baseline:', error);
            return res.status(500).json({
                error: error.message || 'Internal server error'
            });
        }
    }));
    return router;
}
exports.domRouter = domRouter;
