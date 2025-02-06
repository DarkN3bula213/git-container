import { withTransaction } from '@/data/database/db.utils';
import { Logger } from '@/lib/logger';
import ClassModel from '@/modules/school/classes/class.model';
import { createIClassSubject } from '@/modules/school/classes/class.utils';
import { IClassSubject } from '@/modules/school/classes/interfaces';
import { IMigration } from '@/types/migration';
import { Types } from 'mongoose';
import subjects from '../json/subjects.json';

const logger = new Logger('add-subjects-to-classes');

interface SubjectData {
	label: string;
	className: string;
	type: string;
	code: string;
	orderIndex: number;
	hasComponents: boolean;
	componentGroup?: string;
}

async function validateClasses(subjects: SubjectData[]): Promise<string[]> {
	const uniqueClassNames = [...new Set(subjects.map((s) => s.className))];
	const existingClasses = await ClassModel.find({
		className: { $in: uniqueClassNames }
	}).lean();
	const existingClassNames = existingClasses.map((c) => c.className);

	return uniqueClassNames.filter(
		(className) => !existingClassNames.includes(className)
	);
}

function groupSubjectsByClass(
	subjects: SubjectData[]
): Record<string, SubjectData[]> {
	return subjects.reduce(
		(acc, subject) => {
			if (!acc[subject.className]) {
				acc[subject.className] = [];
			}
			acc[subject.className].push(subject);
			return acc;
		},
		{} as Record<string, SubjectData[]>
	);
}

async function addSubjectsToClasses(dryRun = false): Promise<void> {
	try {
		await withTransaction(async (session) => {
			// Validate all classes exist
			const missingClasses = await validateClasses(subjects);
			if (missingClasses.length > 0) {
				throw new Error(
					`Missing class documents for: ${missingClasses.join(', ')}`
				);
			}

			// Group subjects by class
			const subjectsByClass = groupSubjectsByClass(subjects);
			let totalSubjectsAdded = 0;
			let updatedClasses = 0;

			// Process each class
			for (const [className, classSubjects] of Object.entries(
				subjectsByClass
			)) {
				const classDoc = await ClassModel.findOne({ className }, null, {
					session
				});
				if (!classDoc) {
					logger.warn(`Class ${className} not found, skipping`);
					continue;
				}

				if (dryRun) {
					logger.info(
						`[DRY RUN] Would add ${classSubjects.length} subjects to class ${className}`
					);
					totalSubjectsAdded += classSubjects.length;
					updatedClasses++;
					continue;
				}

				try {
					// Transform subjects to IClassSubject format
					const transformedSubjects: IClassSubject[] =
						classSubjects.map((subject) =>
							createIClassSubject(
								{
									name: subject.label,
									_id: new Types.ObjectId()
								},
								className,
								classDoc._id as Types.ObjectId,
								''
							)
						);

					// Update class with new subjects
					await ClassModel.updateOne(
						{ _id: classDoc._id },
						{ $set: { subjects: transformedSubjects } },
						{ session }
					);

					totalSubjectsAdded += transformedSubjects.length;
					updatedClasses++;
					logger.info(
						`Added ${transformedSubjects.length} subjects to class ${className}`
					);
				} catch (error) {
					logger.error(
						`Failed to process subjects for class ${className}:`,
						error
					);
					throw error;
				}
			}

			logger.info(
				`Migration completed: Updated ${updatedClasses} classes with ${totalSubjectsAdded} subjects`
			);
		});
	} catch (error) {
		logger.error('Migration failed:', error);
		throw error;
	}
}

async function rollbackSubjectsFromClasses(): Promise<void> {
	try {
		await withTransaction(async (session) => {
			const result = await ClassModel.updateMany(
				{ subjects: { $exists: true, $ne: [] } },
				{ $set: { subjects: [] } },
				{ session }
			);

			logger.info(
				`Rollback completed: Cleared subjects from ${result.modifiedCount} classes`
			);
		});
	} catch (error) {
		logger.error('Rollback failed:', error);
		throw error;
	}
}

export const add_subjects_to_classes: IMigration = {
	name: 'add-subjects-to-classes',
	up: async () => {
		await addSubjectsToClasses(true);
	},
	down: async () => {
		await rollbackSubjectsFromClasses();
	}
};
