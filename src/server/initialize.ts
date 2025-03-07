import { cache } from '@/data/cache/cache.service';
import { db } from '@/data/database';
import { initializeConfig } from '@/lib/config';
import { getUploadsDir } from '@/lib/constants';
import { Logger } from '@/lib/logger';
// import subjectMigration from '@/scripts/subjectMigration';
import { setupCronJobs } from '@/services/cron';
import { sendOnDeployment } from '@/services/mail/mailTrap';
import SocketService from '@/sockets';
import fs from 'fs-extra';
import { Server } from 'http';
import path from 'node:path';

const logger = new Logger('server/initialize');

export const initializeServer = {
	async config() {
		await initializeConfig();
	},

	async directories() {
		try {
			const uploadsDir = getUploadsDir();
			const imagesDir = path.join(uploadsDir, 'images');
			const documentsDir = path.join(uploadsDir, 'documents');
			const studentsDir = path.join(uploadsDir, 'students');

			// fs-extra's ensureDir function checks if a directory exists, and creates it if it doesn't
			await fs.ensureDir(uploadsDir);
			await fs.ensureDir(imagesDir);
			await fs.ensureDir(documentsDir);
			await fs.ensureDir(studentsDir);

			logger.info('Ensured that upload directories exist.');
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Failed to create directories: ${error.message}`);
			}
			throw error;
		}
	},

	async dataSources() {
		await db.connect();
		await cache.getClient().connect();
		logger.info('Data sources initialized successfully');
	},

	async setupWebSockets(server: Server) {
		const socketService = SocketService.getInstance(server);
		logger.info('WebSocket service initialized');
		return socketService;
	},

	async productionTasks() {
		setupCronJobs();
		// await subjectMigration.migrate({ dryRun: true });
		await sendOnDeployment();
		logger.info('Production tasks completed');
	}
};

export const socketService = SocketService.getInstance();
