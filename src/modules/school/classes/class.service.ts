import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
// import { Logger } from '@/lib/logger';
import mongoose from 'mongoose';
import { ClassModel } from './class.model';
import { createIClassSubject } from './class.utils';

export type AddSubjectsToClassRequestBody = {
	name: string;
	teacherId?: string;
	teacherName: string;
};

// const logger = new Logger('Class Service');
class ClassService {
	private static _instance: ClassService;
	constructor(private classes: typeof ClassModel) {}
	static getInstance(classes: typeof ClassModel) {
		if (!ClassService._instance) {
			ClassService._instance = new ClassService(classes);
		}
		return ClassService._instance;
	}

	// Add classTeacher to Class
	public async addClassTeacher(
		classId: string,
		teacherId: string,
		teacherName: string
	): Promise<void> {
		return withTransaction(async (session) => {
			const existingClass = await this.classes.findById(classId);
			if (!existingClass) {
				throw new BadRequestError('Class not found');
			}

			const updateClass = await this.classes.findByIdAndUpdate(
				existingClass._id,
				{
					$set: {
						classTeacher: {
							teacherId: teacherId,
							teacherName: teacherName
						}
					}
				},
				{ session, new: true }
			);

			if (!updateClass) {
				throw new BadRequestError('Could not add teacher to class');
			}
		});
	}
	public async removeClassSubjects(
		classId: string,
		subjectId: string
	): Promise<void> {
		return withTransaction(async (session) => {
			const existingClass = await this.classes
				.findByIdAndUpdate(
					classId,
					{
						$pull: {
							subjects: {
								_id: subjectId
							}
						}
					},
					{ new: true }
				)
				.session(session);
			if (!existingClass) {
				throw new BadRequestError('Class not found');
			}
		});
	}

	/*<!-- 1. Add Subjects  ---------------------------( POST )->*/
	public async addSubjects(
		classId: string,
		subjects: AddSubjectsToClassRequestBody[]
	): Promise<void> {
		return withTransaction(async (session) => {
			const classData = await this.classes.findById(classId);
			if (!classData) {
				throw new BadRequestError('Class not found');
			}
			const id = new mongoose.Types.ObjectId(classId);
			const subjectsData = subjects.map((item) => {
				try {
					return createIClassSubject(
						item,
						classData.className,
						id,
						item.teacherName
					);
				} catch (error) {
					console.error('Error creating class subject:', error);
					throw new BadRequestError('Invalid subject data');
				}
			});
			const updateClass = await this.classes.findByIdAndUpdate(
				classId,
				{
					$push: {
						subjects: {
							$each: subjectsData
						}
					}
				},
				{ session, new: true }
			);
			if (!updateClass) {
				throw new BadRequestError('Could not add subjects to class');
			}
		});
	}
}

export default ClassService.getInstance(ClassModel);
