import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError, NotFoundError } from '@/lib/api';
import { Logger } from '@/lib/logger/logger';
import mongoose from 'mongoose';
import TeacherModel from '../../teachers/teacher.model';
import ClassModel from '../class.model';
import { IClass, IClassSection } from '../interfaces';

const logger = new Logger(
	'modules/school/classes/services/class.subject.service'
);

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
	/*<!-- 3. Remove Section  ---------------------------( POST )->*/
	async removeSection(classId: string, sectionName: string): Promise<IClass> {
		return withTransaction(async (session) => {
			// Validate classId
			if (!mongoose.isValidObjectId(classId)) {
				throw new BadRequestError('Invalid class ID');
			}

			// Find the class
			const classDoc = await ClassModel.findById(classId)
				.session(session)
				.exec();

			if (!classDoc) {
				throw new NotFoundError('Class not found');
			}

			// Check if section exists object with the section name
			const sectionExists = classDoc.sections.some(
				(s) => s.section === sectionName
			);
			logger.info({
				message: 'Section exists',
				sectionExists: sectionExists,
				sectionName: sectionName
			});

			if (!sectionExists) {
				throw new NotFoundError(
					`Section ${sectionName} not found in this class`
				);
			}

			// Update the class document
			const updatedClass = await ClassModel.findByIdAndUpdate(
				classId,
				{ $pull: { sections: { section: sectionName } } },
				{ new: true, session }
			).exec();

			if (!updatedClass) {
				throw new Error('Failed to update class sections');
			}

			return updatedClass;
		});
	}
	public async updateClassSections(
		classId: string,
		sections: IClassSection[]
	): Promise<IClass> {
		return withTransaction(async (session) => {
			// 1. Validate class exists
			logger.info(`Looking up class ${classId}`);
			const classDoc =
				await ClassModel.findById(classId).session(session);

			if (!classDoc) {
				logger.error(`Class not found: ${classId}`);
				throw new BadRequestError('Class not found');
			}

			logger.info({
				message: 'Found class',
				className: classDoc.className,
				sectionArray: classDoc.section,
				existingSections: classDoc.sections?.length || 0
			});
			// 2. Validate that all sections exist in the class.section array
			const validSections = new Set(classDoc.section);
			for (const sectionData of sections) {
				if (!validSections.has(sectionData.section)) {
					throw new BadRequestError(
						`Section "${sectionData.section}" is not valid for class ${classDoc.className}`
					);
				} else {
					logger.info({
						sections: JSON.stringify(sectionData, null, 2),
						message: 'Section is valid'
					});
				}
			}

			// 3. Check for duplicate sections in request
			const requestSections = sections.map((s) => s.section);
			const uniqueSections = new Set(requestSections);
			if (uniqueSections.size !== requestSections.length) {
				throw new BadRequestError(
					'Duplicate sections found in request'
				);
			}

			// 4. Validate all teachers exist
			const teacherIds = [...new Set(sections.map((s) => s.teacherId))];

			// Add detailed logging
			logger.info({
				message: 'Validating teacher IDs',
				teacherIds: JSON.stringify(teacherIds)
			});

			// Try directly using strings in the query without conversion
			const teachers = await TeacherModel.find({
				_id: { $in: teacherIds }
			}).lean();

			logger.info({
				message: 'Teachers found',
				foundCount: teachers.length,
				foundIds: teachers.map((t) => t._id.toString())
			});

			// Create a set of found teacher IDs for lookup
			const validTeacherIds = new Set(
				teachers.map((t) => t._id.toString())
			);

			// Log the set contents to verify
			logger.info({
				message: 'Valid teacher IDs set',
				validTeacherIds: Array.from(validTeacherIds)
			});

			// Check for differences between requested and found IDs
			const missingTeacherIds = teacherIds.filter(
				(id) => !validTeacherIds.has(id.toString())
			);
			logger.info({
				message:
					missingTeacherIds.length > 0
						? 'Missing teacher IDs detected'
						: 'All teacher IDs validated',
				missingTeacherIds
			});

			// Perform the validation check
			const invalidTeachers = sections.filter(
				(s) => !validTeacherIds.has(s.teacherId.toString())
			);
			logger.info({
				message: 'Invalid teachers',
				invalidTeachers: JSON.stringify(invalidTeachers, null, 2)
			});
			// 6. Merge with existing sections (if any)
			let updatedSections = [];

			if (classDoc.sections && classDoc.sections.length > 0) {
				// Create a map of existing sections
				const existingSectionsMap = new Map(
					classDoc.sections.map((s) => [s.section, s])
				);

				// Create a map of new sections
				const newSectionsMap = new Map(
					sections.map((s) => [s.section, s])
				);

				// Combine both maps, with new data taking precedence
				const combinedSectionsMap = new Map([
					...existingSectionsMap,
					...newSectionsMap
				]);

				updatedSections = Array.from(combinedSectionsMap.values());
			} else {
				// No existing sections, use the new ones
				updatedSections = sections;
			}

			// 7. Update the class document
			const updatedClass = await ClassModel.findByIdAndUpdate(
				classId,
				{ sections: updatedSections },
				{ new: true, runValidators: true, session }
			);
			if (!updatedClass) {
				throw new BadRequestError('Could not update class sections');
			}
			return updatedClass;
		});
	}
}

const classSectionService = new ClassSectionService();

export default classSectionService;
