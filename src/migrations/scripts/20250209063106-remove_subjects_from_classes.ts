import { Logger } from '@/lib/logger';
import ClassModel from '@/modules/school/classes/class.model';
import { IMigration } from '@/types/migration';

const logger = new Logger('Remove Subjects from Classes Migration');

export const remove_subjects_from_classes: IMigration = {
	name: 'remove_subjects_from_classes',
	up: async () => {
		const classes = await ClassModel.find({});
		for (const classDoc of classes) {
			classDoc.subjects = [];
			await classDoc.save();
			logger.info(`Removed subjects from ${classDoc.className}`);
		}
		logger.info('Successfully removed subjects from all classes');
	},
	down: async () => {
		// Rollback implementation
	}
};
