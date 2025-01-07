// migrations/subjectMigration.ts
import { withTransaction } from '@/data/database/db.utils';
import { Logger } from '@/lib/logger';
import { ClassModel } from '@/modules/school/classes/class.model';
import { generateSubjectsData } from '@/modules/school/subjects/subject.data';
import { ISubject, Subject } from '@/modules/school/subjects/subject.model';
import mongoose, { ClientSession } from 'mongoose';

const logger = new Logger('SubjectMigration');

interface MigrationOptions {
	force?: boolean; // Whether to force re-run migration
	dryRun?: boolean; // Run without making changes
}

interface MigrationResult {
	success: boolean;
	message: string;
	status: 'COMPLETED' | 'SKIPPED' | 'DRY_RUN' | 'ROLLED_BACK';
	createdCount?: number;
	deletedCount?: number;
}

class SubjectMigration {
	private static instance: SubjectMigration;
	private hasRun: boolean = false;

	private constructor() {}

	static getInstance(): SubjectMigration {
		if (!SubjectMigration.instance) {
			SubjectMigration.instance = new SubjectMigration();
		}
		return SubjectMigration.instance;
	}

	private async validateClassReferences(
		subjectsData: Partial<ISubject>[],
		classMapping: Record<string, mongoose.Types.ObjectId>
	): Promise<string[]> {
		return subjectsData
			.filter((subject) => !classMapping[subject.className as string])
			.map((subject) => subject.className as string);
	}

	private async checkExistingSubjects(
		session: ClientSession
	): Promise<boolean> {
		const count = await Subject.countDocuments({}, { session });
		return count > 0;
	}

	private async getClassMapping(
		session: ClientSession
	): Promise<Record<string, mongoose.Types.ObjectId>> {
		const classes = await ClassModel.find({}, null, { session }).lean();
		return classes.reduce(
			(acc, cls) => ({
				...acc,
				[cls.className]: cls._id
			}),
			{}
		);
	}

	async migrate(options: MigrationOptions = {}): Promise<MigrationResult> {
		if (this.hasRun && !options.force) {
			logger.info('Migration has already run. Use force:true to re-run.');
			return {
				success: true,
				message: 'Migration already completed',
				status: 'SKIPPED'
			};
		}

		try {
			const result = await withTransaction(async (session) => {
				// Check for existing subjects
				const hasExisting = await this.checkExistingSubjects(session);
				if (hasExisting && !options.force) {
					return {
						success: true,
						message: 'Subjects already exist',
						status: 'SKIPPED' as const
					};
				}

				// Get class mapping
				const classMapping = await this.getClassMapping(session);

				// Generate subject data
				const subjectsData = generateSubjectsData();

				// Validate class references
				const missingClasses = await this.validateClassReferences(
					subjectsData,
					classMapping
				);

				if (missingClasses.length > 0) {
					throw new Error(
						`Missing class documents for: ${missingClasses.join(', ')}`
					);
				}

				// Enhance subjects with class IDs
				const enhancedSubjectsData = subjectsData.map((subject) => ({
					...subject,
					classId: classMapping[subject.className as string]
				}));

				if (options.dryRun) {
					return {
						success: true,
						message: 'Dry run completed successfully',
						status: 'DRY_RUN' as const,
						subjectsToCreate: enhancedSubjectsData.length
					};
				}

				// Clear existing if force is true
				if (options.force) {
					await Subject.deleteMany({}, { session });
				}

				// Insert new subjects
				const inserted = await Subject.insertMany(
					enhancedSubjectsData,
					{ session }
				);

				this.hasRun = true;
				return {
					success: true,
					message: 'Subjects migration completed successfully',
					status: 'COMPLETED' as const,
					createdCount: inserted.length
				};
			});

			logger.info({ event: 'Subjects migration completed', result });
			return result;
		} catch (error) {
			logger.error(`Subjects migration failed ${error}`);
			throw error;
		}
	}

	// Rollback capability
	async rollback(): Promise<MigrationResult> {
		try {
			return await withTransaction(async (session) => {
				const count = await Subject.countDocuments({}, { session });
				await Subject.deleteMany({}, { session });

				this.hasRun = false;
				return {
					success: true,
					message: 'Rollback completed successfully',
					status: 'ROLLED_BACK',
					deletedCount: count
				};
			});
		} catch (error) {
			logger.error(`Subjects migration rollback failed ${error}`);
			throw error;
		}
	}
}

const subjectMigration = SubjectMigration.getInstance();

export default subjectMigration;
