import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import winston from 'winston';
import { Database } from './database';
import { WebSocketHandler } from './websocket';
import { createBoardsRouter } from './routes/boards';
import { createSettingsRouter } from './routes/settings';
import { SettingsConfig } from './settings-config';
import { config } from './config';

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'api.log' })
	]
});

async function startServer() {
	try {
		const database = new Database();
		await database.initialize();
		logger.info('Database initialized successfully');

		const settingsConfig = new SettingsConfig();
		await settingsConfig.initialize();
		logger.info('Settings configuration initialized successfully');

		const app = express();
		const server = createServer(app);

		app.use(cors(config.cors));
		app.use(express.json({ limit: '10mb' }));
		app.use(express.urlencoded({ extended: true, limit: '10mb' }));

		app.use((req, res, next) => {
			logger.info(`${req.method} ${req.path}`, {
				method: req.method,
				path: req.path,
				query: req.query,
				ip: req.ip
			});
			next();
		});

		app.get('/health', (req, res) => {
			res.json({
				status: 'ok',
				timestamp: new Date().toISOString(),
				uptime: process.uptime()
			});
		});

		app.use('/api/boards', createBoardsRouter(database));
		app.use('/api/settings', createSettingsRouter(settingsConfig));

		const wsHandler = new WebSocketHandler(server, database);
		logger.info('WebSocket handler initialized');

		app.use(
			(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
				logger.error('Unhandled error:', err);
				res.status(500).json({ error: 'Internal server error' });
			}
		);

		server.listen(config.port, config.host, () => {
			logger.info(`🚀 PortalDraw API server running on http://${config.host}:${config.port}`);
			logger.info(`📡 WebSocket server ready for connections`);
			logger.info(`💾 Database: ${config.database.path}`);
		});

		const gracefulShutdown = (signal: string) => {
			logger.info(`${signal} received, shutting down gracefully...`);

			server.close(() => {
				logger.info('HTTP server closed');
				database.close();
				process.exit(0);
			});

			setTimeout(() => {
				logger.error('Forced shutdown due to timeout');
				process.exit(1);
			}, 10000);
		};

		process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
		process.on('SIGINT', () => gracefulShutdown('SIGINT'));
	} catch (error) {
		logger.error('Failed to start server:', error);
		process.exit(1);
	}
}

startServer().catch((error) => {
	logger.error('Startup error:', error);
	process.exit(1);
});
