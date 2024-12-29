import { ProductionLogger } from '@/lib/logger/v1/logger';
import mongoose, { type ClientSession, Types } from 'mongoose';

type TransactionCallback<T> = (session: ClientSession) => Promise<T>;
const logger = new ProductionLogger(__filename);

export async function withTransaction<T>(
	callback: TransactionCallback<T>
): Promise<T> {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const result = await callback(session);
		// Only commit if we haven't thrown any errors
		await session.commitTransaction();
		logger.info('Transaction Success');
		return result;
	} catch (error) {
		logger.error('Transaction failed, rolling back...', error);
		await session.abortTransaction();
		// Re-throw the error after rollback
		throw error;
	} finally {
		await session.endSession();
	}
}
export const convertToObjectId = (id: string): Types.ObjectId => {
	return new Types.ObjectId(id);
};

export async function ensureAllIndexes(): Promise<void> {
	return withTransaction(async (session) => {
		const modelNames = mongoose.modelNames();
		const fixedModels: string[] = [];
		let totalIndexes = 0;

		try {
			logger.info('Starting index synchronization for all models...');

			for (const modelName of modelNames) {
				const model = mongoose.model(modelName);

				// Get existing indexes
				const existingIndexes = await model.collection.indexes();

				// Special handling for Payment model due to known issues
				if (modelName === 'Payment') {
					// Only drop the problematic index if it exists
					const hasProblematicIndex = existingIndexes.some(
						(index) => index.name === 'invoiceId_1'
					);

					if (hasProblematicIndex) {
						logger.info(
							`Dropping problematic index 'invoiceId_1' for ${modelName}`
						);
						await model.collection.dropIndex('invoiceId_1');
					}
				}

				// Sync indexes with background: true for safer rebuilding
				const result = await model.syncIndexes({
					session,
					background: true
				});

				fixedModels.push(modelName);
				totalIndexes += result.length;

				logger.info({
					message: `Synchronized indexes for ${modelName}`
				});
			}

			logger.info({
				message: 'Index synchronization completed successfully',
				modelsUpdated: fixedModels,
				totalIndexes
			});
		} catch (error) {
			logger.error({
				message: 'Error during index synchronization',
				error: error
			});

			// Consider if you really want to exit the process
			// Maybe throw the error instead and let the caller decide
			throw error;
		}
	});
}

export async function needsIndexRebuild(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	model: mongoose.Model<any>,
	indexName: string
): Promise<boolean> {
	const indexes = await model.collection.indexes();
	const index = indexes.find((idx) => idx.name === indexName);

	// Add your criteria for determining if rebuild is needed
	return !index || index.background !== true;
}

export async function ensureAllIndexesProduction(): Promise<void> {
	return withTransaction(async (session) => {
		const modelNames = mongoose.modelNames();

		for (const modelName of modelNames) {
			const model = mongoose.model(modelName);

			// 1. Check current database load
			const serverStatus = await mongoose.connection.db
				?.admin()
				.serverStatus();
			if (serverStatus?.connections.current > 1000) {
				// Example threshold
				logger.warn('High connection count, delaying index operations');
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}

			// // 2. Check if we're in peak hours
			// const hour = new Date().getHours();
			// if (hour >= 9 && hour <= 17) {
			// 	// Business hours
			// 	logger.warn(
			// 		'Peak hours detected, consider scheduling this operation later'
			// 	);
			// }

			// 3. Progressive index rebuilding
			const indexes = await model.collection.indexes();
			for (const index of indexes) {
				if (await needsIndexRebuild(model, index.name ?? '')) {
					logger.info(
						`Rebuilding index ${index.name ?? ''} for ${modelName}`
					);
					await model.collection.dropIndex(index.name ?? '');
					await new Promise((resolve) => setTimeout(resolve, 1000)); // Cool down
					await model.syncIndexes({
						session,
						background: true
					});
				}
			}
		}
	});
}

/**
 * Helper function to find duplicates in a field that should be unique.
 */
export async function findDuplicateValues(
	model: mongoose.Model<unknown>,
	fieldName: string
): Promise<number> {
	// Aggregation to find duplicate counts
	const results = await model.aggregate([
		{ $group: { _id: `$${fieldName}`, count: { $sum: 1 } } },
		{ $match: { count: { $gt: 1 } } },
		{ $group: { _id: null, totalDuplicates: { $sum: '$count' } } }
	]);

	return results.length > 0 ? results[0].totalDuplicates : 0;
}
