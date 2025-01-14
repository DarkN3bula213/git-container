import { config } from '@/lib/config';
import { format } from 'date-fns';
import fs from 'fs-extra';
import http from 'node:http';
import path from 'node:path';
import { app } from './app';
import { cache } from './data/cache/cache.service';
import { db } from './data/database';
import { banner, signals } from './lib/constants';
import { Logger } from './lib/logger';
import subjectMigration from './scripts/subjectMigration';
import { setupCronJobs } from './services/cron';
import { sendOnDeployment } from './services/mail/mailTrap';
import SocketService from './sockets';

const logger = new Logger(__filename);
const server = http.createServer(app);
const socketService = SocketService.getInstance(server);

const PORT = config.app.port;

const createDirectories = async () => {
	try {
		// Use process.cwd() to reliably get the project root directory
		const projectRoot = process.cwd();
		const uploadsDir = path.join(projectRoot, 'uploads');
		const imagesDir = path.join(uploadsDir, 'images');
		const documentsDir = path.join(uploadsDir, 'documents');

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
async function initializeDataSources() {
	await db.connect();
	await cache.getClient().connect();
}

const startServer = async () => {
	const date = new Date();
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	// Get time in Pakistan
	const pkTime = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Asia/Karachi',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	}).format(date);
	try {
		setupCronJobs();

		if (config.production) {
			// console.log('Starting server in production mode');
			// await ensureAllIndexes();
			await subjectMigration.migrate({ dryRun: true });
			await sendOnDeployment();
			logger.info('Subject migration completed');
		}
		// Dry run to check what would happen

		// Start the server and listen on all network interfaces
		server.listen(PORT, () => {
			logger.warn({
				port: PORT,
				node: banner,
				date: format(date, 'PPP'),
				timeZone: timeZone,
				pkTime: pkTime,
				mode: config.production ? 'Production' : 'Development'
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

			// Create a promise for server closure
			const serverClosed = new Promise((resolve) => {
				server.close(() => {
					logger.debug('HTTP server closed.');
					resolve(true);
				});
			});

			// Handle existing connections
			if (socketService) {
				socketService.disconnect();
				logger.debug('WebSocket connections closed.');
			}

			// Wait for all operations to complete
			await Promise.all([
				serverClosed,
				cache
					.getClient()
					.disconnect()
					.catch((err) => {
						logger.error('Error disconnecting cache:', err);
					}),
				db.disconnect().catch((err) => {
					logger.error('Error disconnecting database:', err);
				})
			]);

			logger.debug('All connections closed successfully.');

			// Give time for final logs to be written
			process.exit(1);
		} catch (error) {
			logger.error('Failed to shut down gracefully', error);
			setTimeout(() => {
				process.exit(1);
			}, 100);
		}
	});
});
export { socketService };

createDirectories()
	.then(initializeDataSources)
	.then(startServer)
	.catch((error) => {
		logger.error(
			'Failed to initialize required directories or server setup.',
			error
		);
		process.exit(1);
	});
