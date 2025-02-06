import { withTransaction } from '@/data/database/db.utils';
import { ClientSession } from 'mongoose';
import ClassModel from '../../classes/class.model';
import { IClass } from '../../classes/interfaces';
import { Student } from '../student.interface';
import StudentModel from '../student.model';

class PromotionService {
	private static instance: PromotionService;

	constructor(
		private readonly student: typeof StudentModel,
		private readonly classModel: typeof ClassModel
	) {}

	static getInstance() {
		if (!PromotionService.instance) {
			PromotionService.instance = new PromotionService(
				StudentModel,
				ClassModel
			);
		}
		return PromotionService.instance;
	}

	private async validateStudents(studentIds: string[], session: any) {
		const students = await this.student
			.find({ _id: { $in: studentIds } })
			.session(session);

		if (students.length !== studentIds.length) {
			throw new Error('Some students not found');
		}

		const uniqueClasses = new Set(students.map((s) => s.classId));
		if (uniqueClasses.size > 1) {
			throw new Error('Students are not in the same class');
		}

		return students;
	}

	private async validateClass(
		classId: string,
		section: string,
		session: ClientSession
	) {
		const targetClass = await this.classModel
			.findById(classId)
			.session(session);

		if (!targetClass) {
			throw new Error('Class not found');
		}

		if (!targetClass.section.includes(section)) {
			throw new Error(
				`Invalid section ${section} for class ${targetClass.className}`
			);
		}

		return targetClass;
	}

	async promoteStudent(
		studentIds: string[],
		targetId: string,
		section: IClass['section']
	) {
		return withTransaction(async (session) => {
			try {
				// Validate students and class
				const students = await this.validateStudents(
					studentIds,
					session
				);
				const targetClass = await this.validateClass(
					targetId,
					section[0],
					session
				);

				// Prepare promotion history
				const promotionHistory = {
					previousClassId: students[0].classId,
					previousSection: students[0].section,
					newClassId: targetId,
					newClass: targetClass.className,
					newSection: section,
					promotionDate: new Date(),
					oldTuitionFee: students[0].tuition_fee,
					newTuitionFee: targetClass.fee
				};

				// Update the students with the new promotion history
				const updatedStudents = await this.student.updateMany(
					{ _id: { $in: studentIds } },
					{
						$set: {
							className: targetClass.className,
							classId: targetId,
							section: section,
							tuition_fee: targetClass.fee
						},
						$push: { promotionHistory: promotionHistory }
					},
					{ session }
				);

				if (!updatedStudents.modifiedCount) {
					throw new Error('No students were updated');
				}

				return updatedStudents;
			} catch (error) {
				throw error instanceof Error
					? error
					: new Error('Failed to promote students');
			}
		});
	}

	async rollBackPromotion(studentIds: string[]) {
		return withTransaction(async (session) => {
			try {
				// Get students with their promotion history
				const students = await this.student
					.find({
						_id: { $in: studentIds },
						'promotionHistory.0': { $exists: true } // Ensure there's promotion history
					})
					.session(session);

				if (students.length !== studentIds.length) {
					throw new Error(
						'Some students have no promotion history to rollback'
					);
				}

				const updatedStudents: Student[] = [];

				for (const student of students) {
					const lastPromotion = student.promotionHistory[0];
					if (!lastPromotion) {
						throw new Error(
							`No promotion history found for student ${student._id}`
						);
					}

					// Validate previous class still exists
					const previousClass = await this.classModel
						.findById(lastPromotion.previousClassId)
						.session(session);

					if (!previousClass) {
						throw new Error(
							`Previous class ${lastPromotion.previousClassId} not found`
						);
					}

					// Update student with previous class info
					const updatedStudent = await this.student.findOneAndUpdate(
						{ _id: student._id },
						{
							$set: {
								classId: lastPromotion.previousClassId,
								section: lastPromotion.previousSection,
								tuition_fee: lastPromotion.oldTuitionFee
							},
							$pop: { promotionHistory: -1 } // Remove the latest promotion history
						},
						{ new: true, session }
					);

					if (!updatedStudent) {
						throw new Error(
							`Failed to update student ${student._id}`
						);
					}

					updatedStudents.push(updatedStudent);
				}

				return updatedStudents;
			} catch (error) {
				throw error instanceof Error
					? error
					: new Error('Failed to rollback promotion');
			}
		});
	}
}

export default PromotionService.getInstance();
