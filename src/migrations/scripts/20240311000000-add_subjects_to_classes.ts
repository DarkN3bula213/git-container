import { Logger } from '@/lib/logger';
import ClassModel from '@/modules/school/classes/class.model';
import { generateSubjectId } from '@/modules/school/classes/class.utils';
import { IClassSubject } from '@/modules/school/classes/interfaces';
import { generateSubjectsData } from '@/modules/school/subjects/subject.data';
import { IMigration } from '@/types/migration';
import mongoose from 'mongoose';

const logger = new Logger('add_subjects');

export const add_subjects: IMigration = {
	name: 'add_subjects',
	up: async () => {
		await migrateSubjects(false);
	},
	down: async () => {
		// await migrateSubjects(false);
	}
};

interface IMigrationLog {
	timestamp: Date;
	operation: string;
	status: 'completed' | 'failed' | 'rolled-back';
	details: any;
}

// Mapping function to convert generated data to schema format
// function mapToClassSubject(subject: any): IClassSubject {
// 	return {
// 		// classId,
// 		subjectId: new mongoose.Types.ObjectId(),
// 		code: subject.code,
// 		name: subject.label,
// 		level: subject.type,
// 		prescribedBooks: [],

// 		teacherName: ''
// 	};
// }
function mapToClassSubject(subject: any, className: string): IClassSubject {
	return {
		// classId,
		subjectId: subject.code,
		code: generateSubjectId(subject.label, className),
		name: subject.label,
		level:
			className === '10th'
				? `${className.slice(0, 2)}-${subject.type}`
				: `${className.slice(0, 1)}-${subject.type}`,
		prescribedBooks: [],

		teacherName: ''
	};
}
async function migrateSubjects(isDryRun = true) {
	const session = await mongoose.startSession();
	session.startTransaction();

	const migrationLogs: IMigrationLog[] = [];
	const backupData = new Map();

	try {
		const classes = await ClassModel.find({}).session(session);
		const subjectsData = generateSubjectsData();

		for (const classDoc of classes) {
			// Backup existing subjects
			if (!classDoc._id || typeof classDoc._id !== 'object') {
				throw new Error('Invalid class document ID');
			}
			backupData.set(classDoc._id.toString(), [
				...(classDoc.subjects || [])
			]);

			const classSubjects = subjectsData.filter(
				(subject) => subject.className === classDoc.className
			);

			const formattedSubjects = classSubjects.map((subject) => {
				return mapToClassSubject(subject, classDoc.className);
			});

			if (isDryRun) {
				logger.info(
					`[DRY RUN] ${classDoc.className}: ${formattedSubjects.length} subjects`
				);
				logger.info({
					className: classDoc.className,
					subjects: JSON.stringify(formattedSubjects, null, 2)
				});
				continue;
			}

			classDoc.subjects = formattedSubjects;
			// console.log(classDoc);
			await classDoc.save({ session });

			migrationLogs.push({
				timestamp: new Date(),
				operation: `Add subjects to ${classDoc.className}`,
				status: 'completed',
				details: { subjectsAdded: formattedSubjects.length }
			});
		}

		if (!isDryRun) {
			await session.commitTransaction();
			logger.info('Migration completed successfully');
		} else {
			await session.abortTransaction();
			logger.info('Dry run completed - no changes made');
		}

		return { success: true, logs: migrationLogs };
	} catch (error) {
		await session.abortTransaction();
		logger.error(JSON.stringify(error, null, 2));

		if (!isDryRun) {
			// Restore from backup
			for (const [classId, subjects] of backupData.entries()) {
				const classDoc = await ClassModel.findById(classId);
				if (classDoc) {
					classDoc.subjects = subjects;
					await classDoc.save();

					migrationLogs.push({
						timestamp: new Date(),
						operation: `Rollback ${classDoc.className}`,
						status: 'rolled-back',
						details: { error: (error as Error).message }
					});
				}
			}
		}

		return { success: false, error, logs: migrationLogs };
	} finally {
		session.endSession();
	}
}
