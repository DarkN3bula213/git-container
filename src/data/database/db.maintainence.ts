import { ProductionLogger } from '@/lib/logger/v1/logger';
import mongoose from 'mongoose';
import { HealthCheckResult, scanModelHealth } from './db.health';
import { rollbackManager } from './db.rollback';

const logger = new ProductionLogger(__filename);

export const performDatabaseMaintenance = async () => {
	try {
		// 1. Perform health check
		logger.info('Starting database health check...');
		const modelNames = mongoose.modelNames();
		const healthResults: HealthCheckResult[] = [];

		for (const modelName of modelNames) {
			const model = mongoose.model(modelName);
			const uniqueFields = Object.entries(model.schema.paths)
				.filter(([, path]) => path.options.unique)
				.map(([field]) => field);

			const result = await scanModelHealth(model, uniqueFields);
			healthResults.push(result);
		}

		// 2. Analyze results and determine if it's safe to proceed
		const hasSerousIssues = healthResults.some(
			(result) =>
				result.duplicates.length > 0 ||
				result.invalidReferences.length > 0
		);

		if (hasSerousIssues) {
			logger.error('Serious issues found in database health check:', {
				results: healthResults
			});
			return;
		}

		// 3. Backup current indexes
		await rollbackManager.backupCurrentIndexes(modelNames);

		// 4. Perform index sync
		for (const modelName of modelNames) {
			const model = mongoose.model(modelName);
			try {
				await model.syncIndexes({ background: true });
			} catch (error) {
				logger.error(`Failed to sync indexes for ${modelName}`, error);
				// Attempt rollback
				await rollbackManager.rollbackIndexes(modelName);
			}
		}

		// 5. Verify final state
		const finalHealthCheck = [];
		for (const modelName of modelNames) {
			const model = mongoose.model(modelName);
			const uniqueFields = Object.entries(model.schema.paths)
				.filter(([, path]) => path.options.unique)
				.map(([field]) => field);

			const result = await scanModelHealth(model, uniqueFields);
			finalHealthCheck.push(result);
		}

		logger.info({
			initialHealth: healthResults,
			finalHealth: finalHealthCheck
		});
	} catch (error) {
		logger.error('Database maintenance failed', error);
		// Implement notification/alert system here
	}
};
