// CyFix Server - Main Entry Point
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Database } from './database';
import { domRouter } from './routes/dom';
import { selectorsRouter } from './routes/selectors';
import { healingRouter } from './routes/healing';
import { statsRouter } from './routes/stats';

export class CyFixServer {
    private app: express.Express;
    private db: Database;
    private port: number;

    constructor(port: number = 3000) {
        this.port = port;
        this.app = express();
        this.db = new Database();

        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        // Enable CORS for all origins (in production, you'd want to restrict this)
        this.app.use(cors());

        // Parse JSON request bodies
        this.app.use(bodyParser.json({ limit: '10mb' }));

        // Basic request logging
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.path}`);
            next();
        });
    }

    private setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // API endpoints
        this.app.use('/api/dom', domRouter(this.db));
        this.app.use('/api/selectors', selectorsRouter(this.db));
        this.app.use('/api/healing', healingRouter(this.db));
        this.app.use('/api/stats', statsRouter(this.db));

        // Error handler
        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('Error:', err);
            res.status(500).json({ error: err.message || 'Internal server error' });
        });
    }

    public async start() {
        try {
            // Initialize the database
            await this.db.initialize();

            // Start the server
            this.app.listen(this.port, () => {
                console.log(`CyFix server started on port ${this.port}`);
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    public async stop() {
        try {
            // Close database connections
            await this.db.close();

            console.log('CyFix server stopped');
        } catch (error) {
            console.error('Error stopping server:', error);
        }
    }
}

// Allow server to be started directly
if (require.main === module) {
    const port = parseInt(process.env.PORT || '3000', 10);
    const server = new CyFixServer(port);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('Received SIGINT signal, shutting down...');
        await server.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM signal, shutting down...');
        await server.stop();
        process.exit(0);
    });

    server.start();
}

export default CyFixServer;