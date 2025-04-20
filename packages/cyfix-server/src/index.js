"use strict";
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
exports.CyFixServer = void 0;
// CyFix Server - Main Entry Point
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const database_1 = require("./database");
const dom_1 = require("./routes/dom");
const selectors_1 = require("./routes/selectors");
const healing_1 = require("./routes/healing");
const stats_1 = require("./routes/stats");
class CyFixServer {
    constructor(port = 3000) {
        this.port = port;
        this.app = (0, express_1.default)();
        this.db = new database_1.Database();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Enable CORS for all origins (in production, you'd want to restrict this)
        this.app.use((0, cors_1.default)());
        // Parse JSON request bodies
        this.app.use(body_parser_1.default.json({ limit: '10mb' }));
        // Basic request logging
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.path}`);
            next();
        });
    }
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        // API endpoints
        this.app.use('/api/dom', (0, dom_1.domRouter)(this.db));
        this.app.use('/api/selectors', (0, selectors_1.selectorsRouter)(this.db));
        this.app.use('/api/healing', (0, healing_1.healingRouter)(this.db));
        this.app.use('/api/stats', (0, stats_1.statsRouter)(this.db));
        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({ error: err.message || 'Internal server error' });
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Initialize the database
                yield this.db.initialize();
                // Start the server
                this.app.listen(this.port, () => {
                    console.log(`CyFix server started on port ${this.port}`);
                });
            }
            catch (error) {
                console.error('Failed to start server:', error);
                process.exit(1);
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Close database connections
                yield this.db.close();
                console.log('CyFix server stopped');
            }
            catch (error) {
                console.error('Error stopping server:', error);
            }
        });
    }
}
exports.CyFixServer = CyFixServer;
// Allow server to be started directly
if (require.main === module) {
    const port = parseInt(process.env.PORT || '3000', 10);
    const server = new CyFixServer(port);
    // Handle graceful shutdown
    process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Received SIGINT signal, shutting down...');
        yield server.stop();
        process.exit(0);
    }));
    process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Received SIGTERM signal, shutting down...');
        yield server.stop();
        process.exit(0);
    }));
    server.start();
}
exports.default = CyFixServer;
