import { db } from '@/data/database';
import { Logger } from '@/lib/logger';
import { migrations } from '@/migrations';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import MigrationModel from './migration.model';

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
import MigrationModel from '../migration.model';
import mongoose from 'mongoose';

export const ${name}: IMigration = {
	name: '${name}',
	up: async () => {
		// Check if already migrated
		const migrationDoc = await MigrationModel.findOne({ name: '${name}' });
		if (migrationDoc?.status === 'completed') {
			console.log('Migration already applied, skipping...');
			return;
		}

		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Implementation
			
			// Record migration
			await MigrationModel.create([{
				name: '${name}',
				version: '1.0.0',
				status: 'completed'
			}], { session });

			await session.commitTransaction();
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
	},
	down: async () => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Rollback implementation

			// Update migration status
			await MigrationModel.updateOne(
				{ name: '${name}' },
				{ status: 'rolled_back' }
			).session(session);

			await session.commitTransaction();
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
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
				// Check if migration was already run
				const migrationDoc = await MigrationModel.findOne({
					name: migration.name
				});
				if (migrationDoc?.status === 'completed') {
					logger.debug(
						`Migration ${migration.name} already completed, skipping...`
					);
					continue;
				}

				logger.debug(`Running migration: ${migration.name}`);

				// Create pending migration record
				await MigrationModel.create({
					name: migration.name,
					version: '1.0.0',
					status: 'pending'
				});

				// Run migration
				await migration.up();

				// Update migration status
				await MigrationModel.updateOne(
					{ name: migration.name },
					{ status: 'completed' }
				);

				logger.debug(`Completed migration: ${migration.name}`);
			} catch (error) {
				logger.error(
					`Failed to run migration ${migration.name}:`,
					error
				);

				// Update migration status to failed
				await MigrationModel.updateOne(
					{ name: migration.name },
					{ status: 'failed' }
				);

				throw error;
			}
		}

		logger.debug('All migrations completed successfully');
	} catch (error) {
		logger.error(`error: ${JSON.stringify(error, null, 2)}`);
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
