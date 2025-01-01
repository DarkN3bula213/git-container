import { Logger } from '@/lib/logger';
import mongoose from 'mongoose';

const logger = new Logger('db.rollback');

interface IndexBackup {
	modelName: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	indexes: any[];
	timestamp: Date;
}

class IndexRollbackManager {
	private readonly backups: Map<string, IndexBackup[]> = new Map();
	private static instance: IndexRollbackManager;

	private constructor() {}

	static getInstance(): IndexRollbackManager {
		if (!IndexRollbackManager.instance) {
			IndexRollbackManager.instance = new IndexRollbackManager();
		}
		return IndexRollbackManager.instance;
	}

	async backupCurrentIndexes(modelNames: string[]): Promise<void> {
		for (const modelName of modelNames) {
			try {
				const model = mongoose.model(modelName);
				const currentIndexes = await model.collection.indexes();

				let modelBackups = this.backups.get(modelName) || [];
				modelBackups.push({
					modelName,
					indexes: currentIndexes,
					timestamp: new Date()
				});

				// Keep only last 5 backups
				if (modelBackups.length > 5) {
					modelBackups = modelBackups.slice(-5);
				}

				this.backups.set(modelName, modelBackups);

				logger.info({
					message: `Backed up indexes for ${modelName}`,
					indexCount: currentIndexes.length
				});
			} catch (error) {
				logger.error(
					`Failed to backup indexes for ${modelName}`,
					error
				);
				throw error;
			}
		}
	}

	async rollbackIndexes(
		modelName: string,
		targetTimestamp?: Date
	): Promise<boolean> {
		const modelBackups = this.backups.get(modelName);
		if (!modelBackups?.length) {
			logger.error(`No index backups found for ${modelName}`);
			return false;
		}

		let targetBackup: IndexBackup;
		if (targetTimestamp) {
			const found = modelBackups.find(
				(backup) =>
					backup.timestamp.getTime() <= targetTimestamp.getTime()
			);
			if (!found) {
				logger.error({
					message: `No backup found before timestamp for ${modelName}`,
					timestamp: targetTimestamp
				});
				return false;
			}
			targetBackup = found;
		} else {
			targetBackup = modelBackups[modelBackups.length - 1];
		}

		if (!targetBackup) {
			logger.error(`No suitable backup found for ${modelName}`);
			return false;
		}

		try {
			const model = mongoose.model(modelName);

			// Create a temporary collection for safety
			const tempCollName = `${modelName}_temp_${Date.now()}`;
			await mongoose.connection.db?.createCollection(tempCollName);

			// Copy current indexes to temp collection
			const currentIndexes = await model.collection.indexes();
			const tempColl = mongoose.connection.db?.collection(tempCollName);
			for (const index of currentIndexes) {
				if (index.name !== '_id_') {
					await tempColl?.createIndex(index.key, {
						...index,
						background: true
					});
				}
			}

			// Drop current indexes (except _id)
			for (const index of currentIndexes) {
				if (index.name !== '_id_' && index.name) {
					await model.collection.dropIndex(index.name);
				}
			}

			// Recreate backup indexes
			for (const index of targetBackup.indexes) {
				if (index.name !== '_id_') {
					await model.collection.createIndex(index.key, {
						...index,
						background: true
					});
				}
			}

			// Verify new indexes
			const newIndexes = await model.collection.indexes();
			const success = this.compareIndexes(
				targetBackup.indexes,
				newIndexes
			);

			if (success) {
				logger.info({
					message: `Successfully rolled back indexes for ${modelName}`,
					timestamp: targetBackup.timestamp
				});
				// Clean up temp collection on success
				await mongoose.connection.db?.dropCollection(tempCollName);
			} else {
				// Rollback failed, restore from temp collection
				logger.warn(
					`Rollback verification failed, restoring from temp collection`
				);
				for (const index of currentIndexes) {
					if (index.name !== '_id_') {
						await model.collection.createIndex(index.key, {
							...index,
							background: true
						});
					}
				}
			}

			return success;
		} catch (error) {
			logger.error({
				message: `Failed to rollback indexes for ${modelName}`,
				error
			});
			return false;
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private compareIndexes(backup: any[], current: any[]): boolean {
		if (backup.length !== current.length) return false;

		return backup.every((backupIndex) => {
			const currentIndex = current.find(
				(i) => i.name === backupIndex.name
			);
			if (!currentIndex) return false;

			return (
				JSON.stringify(backupIndex.key) ===
				JSON.stringify(currentIndex.key)
			);
		});
	}
}

export const rollbackManager = IndexRollbackManager.getInstance();
