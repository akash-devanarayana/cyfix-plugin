// Database Layer
// Handles persistence of DOM snapshots, selectors, and healing records

import sqlite3 from 'sqlite3';
import {Database as SQLiteDatabase, open} from 'sqlite';
import fs from 'fs/promises';
import path from 'path';
import {DOMSnapshot} from '../../cyfix-plugin/src/types';

/**
 * Interface for a DOM snapshot record in the database
 */
export interface DOMSnapshotRecord {
    id: number;
    test_id: string;
    url: string;
    title?: string;
    timestamp: number;
    dom_data: string; // JSON string of the DOM snapshot
}

/**
 * Interface for a selector record in the database
 */
export interface SelectorRecord {
    id: number;
    test_id: string;
    selector: string;
    timestamp: number;
    dom_snapshot_id: number;
}

/**
 * Interface for a healing record in the database
 */
export interface HealingRecord {
    id: number;
    original_selector: string;
    healed_selector: string;
    score: number;
    strategy: string;
    timestamp: number;
    success: boolean;
    test_id?: string;
    url: string;
}

/**
 * Database class for handling persistence
 */
export class Database {
    private db: SQLiteDatabase | null = null;
    private dbPath: string;

    constructor(dbPath?: string) {
        this.dbPath = dbPath || path.join(process.cwd(), 'cyfix.db');
    }

    /**
     * Initialize the database and create tables if they don't exist
     */
    public async initialize(): Promise<void> {
        // Ensure the directory exists
        const dbDir = path.dirname(this.dbPath);
        await fs.mkdir(dbDir, {recursive: true});

        // Open the database
        this.db = await open({
            filename: this.dbPath,
            driver: sqlite3.Database
        });

        // Enable foreign keys
        await this.db.exec('PRAGMA foreign_keys = ON');

        // Create tables if they don't exist
        await this.createTables();
    }

    /**
     * Close the database connection
     */
    public async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }

    /**
     * Create database tables if they don't exist
     */
    private async createTables(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        // DOM snapshots table
        await this.db.exec(`
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
        await this.db.exec(`
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
        await this.db.exec(`
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
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_healing_original_selector ON healing_records(original_selector);
            CREATE INDEX IF NOT EXISTS idx_healing_test_id ON healing_records(test_id);
            CREATE INDEX IF NOT EXISTS idx_dom_snapshots_test_id ON dom_snapshots(test_id);
            CREATE INDEX IF NOT EXISTS idx_selectors_test_id ON selectors(test_id);
        `);
    }

    /**
     * Store a DOM snapshot
     */
    public async storeDOMSnapshot(
        testId: string,
        snapshot: DOMSnapshot
    ): Promise<number> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const result = await this.db.run(
            `INSERT OR
            REPLACE INTO dom_snapshots
                (test_id, url, title, timestamp, dom_data)
            VALUES (?, ?, ?, ?, ?)`,
            testId,
            snapshot.url,
            snapshot.title || null,
            snapshot.timestamp,
            JSON.stringify(snapshot)
        );

        return result.lastID || 0;
    }

    /**
     * Get the latest DOM snapshot for a test
     */
    public async getLatestDOMSnapshot(testId: string): Promise<DOMSnapshotRecord | null> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const snapshot = await this.db.get<DOMSnapshotRecord>(
            `SELECT *
             FROM dom_snapshots
             WHERE test_id = ?
             ORDER BY timestamp DESC
             LIMIT 1`,
            testId
        );

        return snapshot || null;
    }

    /**
     * Store a selector with its associated test and DOM snapshot
     */
    public async storeSelector(
        testId: string,
        selector: string,
        domSnapshotId: number
    ): Promise<number> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const result = await this.db.run(
            `INSERT OR
            REPLACE INTO selectors
                (test_id, selector, timestamp, dom_snapshot_id)
            VALUES (?, ?, ?, ?)`,
            testId,
            selector,
            Date.now(),
            domSnapshotId
        );

        return result.lastID || 0;
    }

    /**
     * Get all selectors for a test
     */
    public async getSelectors(testId: string): Promise<SelectorRecord[]> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const selectors = await this.db.all<SelectorRecord[]>(
            `SELECT *
             FROM selectors
             WHERE test_id = ?
             ORDER BY timestamp DESC`,
            testId
        );

        return selectors || [];
    }

    /**
     * Store a healing record
     */
    public async storeHealingRecord(
        originalSelector: string,
        healedSelector: string,
        score: number,
        strategy: string,
        success: boolean,
        url: string,
        testId?: string
    ): Promise<number> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const result = await this.db.run(
            `INSERT INTO healing_records
             (original_selector, healed_selector, score, strategy, timestamp, success, test_id, url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            originalSelector,
            healedSelector,
            score,
            strategy,
            Date.now(),
            success ? 1 : 0,
            testId || null,
            url
        );

        return result.lastID || 0;
    }

    /**
     * Get healing suggestions for a selector
     */
    public async getHealingSuggestions(
        originalSelector: string,
        url?: string
    ): Promise<HealingRecord[]> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        let query = `
            SELECT *
            FROM healing_records
            WHERE original_selector = ?
              AND success = 1
        `;

        const params: any[] = [originalSelector];

        if (url) {
            query += ` AND url = ?`;
            params.push(url);
        }

        query += ` ORDER BY score DESC, timestamp DESC`;

        const records = await this.db.all<HealingRecord[]>(query, ...params);

        return records || [];
    }

    /**
     * Get statistics about healing success
     */
    public async getHealingStats(): Promise<any> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const totalCount = await this.db.get<{ count: number }>(
            `SELECT COUNT(*) as count
             FROM healing_records`
        );

        const successCount = await this.db.get<{ count: number }>(
            `SELECT COUNT(*) as count
             FROM healing_records
             WHERE success = 1`
        );

        const strategyCounts = await this.db.all<{ strategy: string; count: number }[]>(
            `SELECT strategy, COUNT(*) as count
             FROM healing_records
             WHERE success = 1
             GROUP BY strategy
             ORDER BY count DESC`
        );

        const testCounts = await this.db.all<{ test_id: string; count: number }[]>(
            `SELECT test_id, COUNT(*) as count
             FROM healing_records
             GROUP BY test_id
             ORDER BY count DESC
             LIMIT 10`
        );

        return {
            total: totalCount?.count || 0,
            successful: successCount?.count || 0,
            successRate: totalCount?.count ?
                (successCount?.count || 0) / totalCount.count : 0,
            byStrategy: strategyCounts || [],
            byTest: testCounts || []
        };
    }
}