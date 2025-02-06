import { Logger } from '@/lib/logger';
import paymentModel from '@/modules/school/payments/payment.model';
import { Model } from 'mongoose';

const logger = new Logger(__filename);

/**
 * Options for the field removal operation
 */
interface RemoveFieldOptions {
	/** Whether to run in dry run mode (no actual changes) */
	dryRun?: boolean;
	/** Batch size for processing documents */
	batchSize?: number;
}

/**
 * Safely removes a specified field from all documents in a collection
 * @param model The Mongoose model representing the collection
 * @param fieldName The name of the field to remove
 * @param options Configuration options for the removal operation
 * @returns Number of documents updated
 */
export async function removeFieldFromAllDocuments<T>(
	model: Model<T>,
	fieldName: keyof T,
	options: RemoveFieldOptions = {}
): Promise<number> {
	const { dryRun = false, batchSize = 100 } = options;

	try {
		// Get total count of documents
		const totalCount = await model.countDocuments();
		logger.info(
			`Found ${totalCount} documents in ${model.modelName} collection`
		);

		if (dryRun) {
			logger.info('DRY RUN MODE - No changes will be made');
		}

		let processedCount = 0;
		let updatedCount = 0;

		// Process documents in batches
		while (processedCount < totalCount) {
			const documents = await model
				.find({ [fieldName as string]: { $exists: true } } as any)
				.limit(batchSize)
				.skip(processedCount);

			if (documents.length === 0) break;

			if (!dryRun) {
				const bulkOps = documents.map((doc) => ({
					updateOne: {
						filter: { _id: doc._id },
						update: { $unset: { [fieldName as string]: '' } } as any
					}
				}));
				const result = await model.bulkWrite(bulkOps);
				updatedCount += result.modifiedCount ?? 0;
			} else {
				logger.info(
					`DRY RUN MODE - Would have updated ${documents.length} documents`
				);
			}

			processedCount += documents.length;
			logger.info(
				`Processed ${processedCount}/${totalCount} documents. Updated: ${updatedCount}`
			);
		}

		logger.info(
			`Operation completed. ${
				dryRun ? '(DRY RUN) Would have updated' : 'Updated'
			} ${updatedCount} documents`
		);

		return updatedCount;
	} catch (error) {
		logger.error('Error removing field from documents:', error);
		throw error;
	}
}

export async function removeInvoiceIdFromPaymentModel() {
	try {
		// First run in dry-run mode to see what would be updated
		await removeFieldFromAllDocuments(paymentModel, 'invoiceId', {
			dryRun: true
		});

		// Then run the actual update
		const updatedCount = await removeFieldFromAllDocuments(
			paymentModel,
			'invoiceId'
		);
		logger.info(
			`Successfully removed invoiceId from ${updatedCount} documents`
		);
	} catch (error) {
		logger.error('Failed to remove field:', error);
	}
}
