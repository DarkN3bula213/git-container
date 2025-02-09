import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import { User } from '@/modules/auth/users/user.model';
// import { Logger } from '@/lib/logger';
import { PipelineStage } from 'mongoose';
import ClassModel from './class.model';
// import { createIClassSubject } from './class.utils';
import {
	AddSubjectsToClassRequestBody,
	ClassWithSectionCounts,
	IClass
} from './interfaces';

// const logger = new Logger('Class Service');
class ClassService {
	private static _instance: ClassService;
	constructor(private readonly classes: typeof ClassModel) {}
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
			// const id = new mongoose.Types.ObjectId(classId);
			const subjectsData = subjects.map(() => {
				try {
					return {
						// ...item,
						// subjectId: new mongoose.Types.ObjectId(item.subjectId)
					};
					// return createIClassSubject(
					// 		item,
					// 		classData.className,
					// 		id,
					// 		item.teacherName
					// 	);
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
	public async getClassesWithSectionCounts(): Promise<
		ClassWithSectionCounts[]
	> {
		return withTransaction(async (session) => {
			const pipeline: PipelineStage[] = [
				// First stage: Get all classes
				{
					$lookup: {
						from: 'students',
						let: { classId: '$_id' },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ['$classId', '$$classId'] }
											// { $eq: ['$status.isActive', true] }
										]
									}
								}
							},
							{
								$group: {
									_id: '$section',
									count: { $sum: 1 }
								}
							}
						],
						as: 'sectionCounts'
					}
				},
				// Transform the output
				{
					$project: {
						_id: 1,
						className: 1,
						fee: 1,
						section: 1,
						subjects: 1,
						classTeacher: 1,
						orderIndex: {
							$switch: {
								branches: [
									{
										case: {
											$eq: ['$className', 'Nursery']
										},
										then: 1
									},
									{
										case: { $eq: ['$className', 'Prep'] },
										then: 2
									},
									{
										case: { $eq: ['$className', '1st'] },
										then: 3
									},
									{
										case: { $eq: ['$className', '2nd'] },
										then: 4
									},
									{
										case: { $eq: ['$className', '3rd'] },
										then: 5
									},
									{
										case: { $eq: ['$className', '4th'] },
										then: 6
									},
									{
										case: { $eq: ['$className', '5th'] },
										then: 7
									},
									{
										case: { $eq: ['$className', '6th'] },
										then: 8
									},
									{
										case: { $eq: ['$className', '7th'] },
										then: 9
									},
									{
										case: { $eq: ['$className', '8th'] },
										then: 10
									},
									{
										case: { $eq: ['$className', '9th'] },
										then: 11
									},
									{
										case: { $eq: ['$className', '10th'] },
										then: 12
									}
								],
								default: 999
							}
						},
						sections: {
							$map: {
								input: '$section',
								as: 'sec',
								in: {
									section: '$$sec',
									studentCount: {
										$let: {
											vars: {
												sectionData: {
													$filter: {
														input: '$sectionCounts',
														cond: {
															$eq: [
																'$$this._id',
																'$$sec'
															]
														}
													}
												}
											},
											in: {
												$ifNull: [
													{
														$arrayElemAt: [
															'$$sectionData.count',
															0
														]
													},
													0
												]
											}
										}
									}
								}
							}
						},
						totalStudents: {
							$sum: '$sectionCounts.count'
						}
					}
				},
				// Sort by the orderIndex we computed
				{ $sort: { orderIndex: 1 } },
				// Remove the orderIndex from final output
				{
					$project: {
						orderIndex: 0
					}
				}
			];

			const results =
				await ClassModel.aggregate<ClassWithSectionCounts>(
					pipeline
				).session(session);
			return results;
		});
	}

	public async updateClass(
		classId: string,
		updates: Partial<IClass>,
		user: User
	): Promise<IClass> {
		return withTransaction(async (session) => {
			const updatedBy = {
				userId: user._id,
				userName: user.name
			};
			const existingClass = await ClassModel.findById(classId);
			if (!existingClass) {
				throw new BadRequestError('Class not found');
			}
			const updatedClass = await ClassModel.findByIdAndUpdate(
				classId,
				{ $set: { ...updates, updatedBy } },
				{ new: true, session }
			);
			if (!updatedClass) {
				throw new BadRequestError('Could not update class');
			}
			return updatedClass;
		});
	}
}
export default ClassService.getInstance(ClassModel);
