import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import TeacherModel from '../../teachers/teacher.model';
import ClassModel from '../class.model';
import { IClassSection } from '../interfaces';

class ClassSectionService {
	public async addSectionsFields(data: IClassSection[], classId: string) {
		return withTransaction(async (session) => {
			// Find the class
			const classToUpdate = await ClassModel.findById(classId);
			if (!classToUpdate) {
				throw new BadRequestError('Class not found');
			}
			// Check if data is different from the existing sections
			const existingSections = classToUpdate.sections;
			const isDataDifferent = existingSections.some(
				(section) => !data.includes(section)
			);

			// Validate the teacher information
			const teacherIds = data.map((section) => section.teacherId);
			const teachers = await TeacherModel.find({
				_id: { $in: teacherIds }
			});
			if (teachers.length !== teacherIds.length) {
				throw new BadRequestError('Teacher not found');
			}
			if (isDataDifferent) {
				classToUpdate.sections = data;
				await classToUpdate.save({ session });
			}
			return classToUpdate;
		});
	}
}

const classSectionService = new ClassSectionService();

export default classSectionService;
