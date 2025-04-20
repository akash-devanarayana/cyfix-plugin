"use strict";
// Database Layer
// Handles persistence of DOM snapshots, selectors, and healing records
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
exports.Database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * Database class for handling persistence
 */
class Database {
    constructor(dbPath) {
        this.db = null;
        this.dbPath = dbPath || path_1.default.join(process.cwd(), 'cyfix.db');
    }
    /**
     * Initialize the database and create tables if they don't exist
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure the directory exists
            const dbDir = path_1.default.dirname(this.dbPath);
            yield promises_1.default.mkdir(dbDir, { recursive: true });
            // Open the database
            this.db = yield (0, sqlite_1.open)({
                filename: this.dbPath,
                driver: sqlite3_1.default.Database
            });
            // Enable foreign keys
            yield this.db.exec('PRAGMA foreign_keys = ON');
            // Create tables if they don't exist
            yield this.createTables();
        });
    }
    /**
     * Close the database connection
     */
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db) {
                yield this.db.close();
                this.db = null;
            }
        });
    }
    /**
     * Create database tables if they don't exist
     */
    createTables() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            // DOM snapshots table
            yield this.db.exec(`
            CREATE TABLE IF NOT EXISTS dom_snapshots
            (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                test_id   TEXT    NOT NULL,
                url       TEXT    NOT NULL,
                title     TEXT,
                timestamp INTEGER NOT NULL,
                dom_data  TEXT    NOT NULL,
                UNIQUE (test_id, timestamp)
            )
        `);
            // Selectors table
            yield this.db.exec(`
            CREATE TABLE IF NOT EXISTS selectors
            (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                test_id         TEXT    NOT NULL,
                selector        TEXT    NOT NULL,
                timestamp       INTEGER NOT NULL,
                dom_snapshot_id INTEGER,
                FOREIGN KEY (dom_snapshot_id) REFERENCES dom_snapshots (id),
                UNIQUE (test_id, selector)
            )
        `);
            // Healing records table
            yield this.db.exec(`
            CREATE TABLE IF NOT EXISTS healing_records
            (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                original_selector TEXT    NOT NULL,
                healed_selector   TEXT    NOT NULL,
                score             REAL    NOT NULL,
                strategy          TEXT    NOT NULL,
                timestamp         INTEGER NOT NULL,
                success           BOOLEAN NOT NULL,
                test_id           TEXT,
                url               TEXT    NOT NULL
            )
        `);
            // Index for faster queries
            yield this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_healing_original_selector ON healing_records(original_selector);
            CREATE INDEX IF NOT EXISTS idx_healing_test_id ON healing_records(test_id);
            CREATE INDEX IF NOT EXISTS idx_dom_snapshots_test_id ON dom_snapshots(test_id);
            CREATE INDEX IF NOT EXISTS idx_selectors_test_id ON selectors(test_id);
        `);
        });
    }
    /**
     * Store a DOM snapshot
     */
    storeDOMSnapshot(testId, snapshot) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            const result = yield this.db.run(`INSERT OR
            REPLACE INTO dom_snapshots
                (test_id, url, title, timestamp, dom_data)
            VALUES (?, ?, ?, ?, ?)`, testId, snapshot.url, snapshot.title || null, snapshot.timestamp, JSON.stringify(snapshot));
            return result.lastID || 0;
        });
    }
    /**
     * Get the latest DOM snapshot for a test
     */
    getLatestDOMSnapshot(testId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            const snapshot = yield this.db.get(`SELECT *
             FROM dom_snapshots
             WHERE test_id = ?
             ORDER BY timestamp DESC
             LIMIT 1`, testId);
            return snapshot || null;
        });
    }
    /**
     * Store a selector with its associated test and DOM snapshot
     */
    storeSelector(testId, selector, domSnapshotId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            const result = yield this.db.run(`INSERT OR
            REPLACE INTO selectors
                (test_id, selector, timestamp, dom_snapshot_id)
            VALUES (?, ?, ?, ?)`, testId, selector, Date.now(), domSnapshotId);
            return result.lastID || 0;
        });
    }
    /**
     * Get all selectors for a test
     */
    getSelectors(testId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            const selectors = yield this.db.all(`SELECT *
             FROM selectors
             WHERE test_id = ?
             ORDER BY timestamp DESC`, testId);
            return selectors || [];
        });
    }
    /**
     * Store a healing record
     */
    storeHealingRecord(originalSelector, healedSelector, score, strategy, success, url, testId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            const result = yield this.db.run(`INSERT INTO healing_records
             (original_selector, healed_selector, score, strategy, timestamp, success, test_id, url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, originalSelector, healedSelector, score, strategy, Date.now(), success ? 1 : 0, testId || null, url);
            return result.lastID || 0;
        });
    }
    /**
     * Get healing suggestions for a selector
     */
    getHealingSuggestions(originalSelector, url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            let query = `
            SELECT *
            FROM healing_records
            WHERE original_selector = ?
              AND success = 1
        `;
            const params = [originalSelector];
            if (url) {
                query += ` AND url = ?`;
                params.push(url);
            }
            query += ` ORDER BY score DESC, timestamp DESC`;
            const records = yield this.db.all(query, ...params);
            return records || [];
        });
    }
    /**
     * Get statistics about healing success
     */
    getHealingStats() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            const totalCount = yield this.db.get(`SELECT COUNT(*) as count
             FROM healing_records`);
            const successCount = yield this.db.get(`SELECT COUNT(*) as count
             FROM healing_records
             WHERE success = 1`);
            const strategyCounts = yield this.db.all(`SELECT strategy, COUNT(*) as count
             FROM healing_records
             WHERE success = 1
             GROUP BY strategy
             ORDER BY count DESC`);
            const testCounts = yield this.db.all(`SELECT test_id, COUNT(*) as count
             FROM healing_records
             GROUP BY test_id
             ORDER BY count DESC
             LIMIT 10`);
            return {
                total: (totalCount === null || totalCount === void 0 ? void 0 : totalCount.count) || 0,
                successful: (successCount === null || successCount === void 0 ? void 0 : successCount.count) || 0,
                successRate: (totalCount === null || totalCount === void 0 ? void 0 : totalCount.count) ?
                    ((successCount === null || successCount === void 0 ? void 0 : successCount.count) || 0) / totalCount.count : 0,
                byStrategy: strategyCounts || [],
                byTest: testCounts || []
            };
        });
    }
}
exports.Database = Database;
