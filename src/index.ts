import { config } from '@/lib/config';
// import { Logger } from '@/lib/logger';
import { format } from 'date-fns';
import fs from 'fs-extra';
import http from 'node:http';
import path from 'node:path';
import { app } from './app';
import { cache } from './data/cache/cache.service';
import { db } from './data/database';
// import { ensureAllIndexes } from './data/database/db.utils';
import { banner, signals } from './lib/constants';
import { ProductionLogger } from './lib/logger/v1/logger';
import subjectMigration from './scripts/subjectMigration';
import { setupCronJobs } from './services/cron';
import SocketService from './sockets';

const logger = new ProductionLogger(__filename);
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
		// Connect to cache and database
		await cache.connect();
		await db.connect();
		setupCronJobs();

		if (config.isDocker || config.isProduction) {
			// console.log('Starting server in production mode');
			// await ensureAllIndexes();
			await subjectMigration.migrate({ dryRun: true });
			logger.info('Subject migration completed');
		}
		// Dry run to check what would happen

		// Start the server and listen on all network interfaces
		server.listen(PORT, '0.0.0.0' as any, () => {
			logger.info({
				server: `Server instance instantiated and listening on port ${PORT}.`,
				node: banner,
				date: format(date, 'PPP'),
				timeZone: timeZone,
				pkTime: pkTime,
				mode: config.production ? 'Production' : 'Development'
			});
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
