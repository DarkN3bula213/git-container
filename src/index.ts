import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import fs from 'fs-extra';
import http from 'node:http';
import path from 'node:path';
import { app } from './app';
import { cache } from './data/cache/cache.service';
import { db } from './data/database';
import { banner, signals } from './lib/constants';
import { setupCronJobs } from './services/cron';
import SocketService from './sockets';

// import './services/reporting/daily-fees';

const logger = new Logger(__filename);
const server = http.createServer(app);
const socketService = SocketService.getInstance(server);

const PORT = config.app.port;

const createDirectories = async () => {
	try {
		const uploadsDir = path.join(__dirname, 'uploads');
		const imagesDir = path.join(__dirname, '..', 'uploads/images');
		const documentsDir = path.join(__dirname, '..', 'uploads/documents');
		// fs-extra's ensureDir function checks if a directory exists, and creates it if it doesn't
		await fs.ensureDir(uploadsDir);
		await fs.ensureDir(imagesDir);
		await fs.ensureDir(documentsDir);

		logger.info('Ensured that upload directories exist.');
	} catch (error: unknown) {
		if (error instanceof Error) {
			// Type-guard check
			logger.error(
				`Error occurred while trying to start server: ${error.message}`
			);
		} else {
			logger.error(
				'An unexpected error occurred while trying to start the server.'
			);
		}
	}
};

const startServer = async () => {
	try {
		// Connect to cache and database
		await cache.connect();
		await db.connect();
		setupCronJobs();

		// Start the server and listen on all network interfaces
		server.listen(PORT, () => {
			logger.info({
				server: `Server instance instantiated and listening on port ${PORT}.`,
				node: banner
			});
		});
	} catch (error: any) {
		logger.error(
			`Error occurred while trying to start server: ${error.message}`
		);
	}
};
signals.forEach((signal) => {
	process.on(signal, async () => {
		try {
			logger.debug(`Received ${signal}. Shutting down gracefully...`);
			server.close();
			logger.debug('HTTP server closed.');
			cache.disconnect();
			logger.debug('Cache disconnected.');
			await db.disconnect();
			logger.debug('Database disconnected.');
			process.exit(0);
		} catch (error) {
			logger.error('Failed to shut down gracefully', error);
			process.exit(1);
		}
	});
});

export { socketService };

createDirectories()
	.then(startServer)
	.catch((error) => {
		logger.error(
			'Failed to initialize required directories or server setup.',
			error
		);
	});
