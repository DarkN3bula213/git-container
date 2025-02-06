import { db } from '@/data/database';
import { Logger } from '@/lib/logger';
import { migrations } from '@/migrations';
import { config } from 'dotenv';
import fs from 'fs';
// import mongoose from 'mongoose';
import path from 'path';

// Load environment variables
config();

const logger = new Logger(__filename);

async function createMigration(name?: string) {
	if (!name) {
		console.error('Migration name is required for create command');
		process.exit(1);
	}

	const timestamp = new Date()
		.toISOString()
		.replace(/[^0-9]/g, '')
		.slice(0, 14);
	const filename = `${timestamp}-${name}.ts`;
	const templatePath = path.join(
		__dirname,
		'../migrations/scripts',
		filename
	);

	const template = `import { IMigration } from '../types';

export const ${name}: IMigration = {
	up: async () => {
		// Implementation
	},
	down: async () => {
		// Rollback implementation
	}
};`;

	fs.writeFileSync(templatePath, template);
	logger.debug(`Created migration: ${filename}`);
}

async function runMigrations() {
	logger.debug('Starting migrations...');

	try {
		await db.connect();

		for (const migration of migrations) {
			try {
				logger.debug(`Running migration: ${migration.name}`);
				await migration.up();
				logger.debug(`Completed migration: ${migration.name}`);
			} catch (error) {
				logger.error(
					`Failed to run migration ${migration.name}:`,
					error
				);
				throw error;
			}
		}

		logger.debug('All migrations completed successfully');
	} catch (error) {
		logger.error('Migration failed:', error);
		process.exit(1);
	}
}

async function main() {
	const command = process.argv[2];
	const migrationName = process.argv[3];

	try {
		switch (command) {
			case 'create':
				await createMigration(migrationName);
				break;
			case 'up':
				await runMigrations();
				break;
			default:
				logger.error('Usage: migration <create|up> [migration-name]');
				process.exit(1);
		}
	} catch (error) {
		logger.error('Migration failed:', error);
		process.exit(1);
	} finally {
		await db.disconnect();
	}
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
	logger.error('Unhandled rejection:', error);
	process.exit(1);
});

main().catch((error) => {
	logger.error('Migration script failed:', error);
	process.exit(1);
});
