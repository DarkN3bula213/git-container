import { Logger } from '@/lib/logger';
import mongoose from 'mongoose';

const logger = new Logger('db.health');

export interface HealthCheckResult {
	model: string;
	duplicates: {
		field: string;
		count: number;
		values: any[];
	}[];
	inconsistencies: {
		field: string;
		issue: string;
		count: number;
		examples: any[];
	}[];
	missingRequired: {
		field: string;
		count: number;
		documentIds: string[];
	}[];
	invalidReferences: {
		field: string;
		count: number;
		invalidRefs: string[];
	}[];
}

export async function scanModelHealth(
	model: mongoose.Model<any>,
	uniqueFields: string[]
): Promise<HealthCheckResult> {
	const modelName = model.modelName;
	const result: HealthCheckResult = {
		model: modelName,
		duplicates: [],
		inconsistencies: [],
		missingRequired: [],
		invalidReferences: []
	};

	try {
		// Check for duplicates in unique fields
		for (const field of uniqueFields) {
			const duplicates = await model.aggregate([
				{
					$group: {
						_id: `$${field}`,
						count: { $sum: 1 },
						docs: { $push: { _id: '$_id', [field]: `$${field}` } }
					}
				},
				{
					$match: {
						count: { $gt: 1 },
						_id: { $ne: null } // Exclude null values unless specifically looking for them
					}
				}
			]);

			if (duplicates.length > 0) {
				result.duplicates.push({
					field,
					count: duplicates.length,
					values: duplicates.map((d) => ({
						value: d._id,
						occurrences: d.count,
						documentIds: d.docs.map((doc: any) => doc._id)
					}))
				});
			}
		}

		// Check for required fields
		const requiredFields = Object.entries(model.schema.paths)
			.filter(([_, path]) => path.isRequired)
			.map(([field]) => field);

		for (const field of requiredFields) {
			const missingCount = await model.countDocuments({
				[field]: { $in: [null, undefined, ''] }
			});

			if (missingCount > 0) {
				const examples = await model
					.find({ [field]: { $in: [null, undefined, ''] } })
					.limit(5)
					.select('_id');

				result.missingRequired.push({
					field,
					count: missingCount,
					documentIds: examples.map((doc) => doc._id.toString())
				});
			}
		}

		// Check reference integrity
		const refFields = Object.entries(model.schema.paths)
			.filter(
				([_, path]) => path.instance === 'ObjectID' && path.options.ref
			)
			.map(([field, path]) => ({ field, ref: path.options.ref }));

		for (const { field, ref } of refFields) {
			const refModel = mongoose.model(ref);
			const documents = await model
				.find({ [field]: { $ne: null } })
				.select(field);

			const invalidRefs = [];
			for (const doc of documents) {
				const refId = doc[field];
				const exists = await refModel.exists({ _id: refId });
				if (!exists) {
					invalidRefs.push(doc._id.toString());
				}
			}

			if (invalidRefs.length > 0) {
				result.invalidReferences.push({
					field,
					count: invalidRefs.length,
					invalidRefs
				});
			}
		}

		// Check data type consistency
		for (const [field, schemaType] of Object.entries(model.schema.paths)) {
			const expectedType = schemaType.instance;
			if (expectedType === 'Mixed') continue; // Skip mixed types

			const invalidTypes = await model.aggregate([
				{
					$match: {
						[field]: { $exists: true },
						$expr: {
							$ne: [
								{ $type: `$${field}` },
								expectedType.toLowerCase()
							]
						}
					}
				},
				{ $limit: 5 }
			]);

			if (invalidTypes.length > 0) {
				result.inconsistencies.push({
					field,
					issue: `Expected ${expectedType}, found different types`,
					count: invalidTypes.length,
					examples: invalidTypes.map((doc) => ({
						id: doc._id,
						value: doc[field],
						actualType: typeof doc[field]
					}))
				});
			}
		}
	} catch (error) {
		logger.error({
			message: `Error scanning health for model ${modelName}`,
			error
		});
	}

	return result;
}
