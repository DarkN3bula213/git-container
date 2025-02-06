import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import ClassModel from '../classes/class.model';
import { IClass } from '../classes/interfaces';
import paymentModel from '../payments/payment.model';
import { Student } from './student.interface';
import StudentModel from './student.model';

class Service {
	private static instance: Service;
	constructor(
		private student: typeof StudentModel,
		private classModel: typeof ClassModel,
		private feeDocument: typeof paymentModel
	) {}
	static getInstance() {
		if (!Service.instance) {
			Service.instance = new Service(
				StudentModel,
				ClassModel,
				paymentModel
			);
		}
		return Service.instance;
	}
	async getClassIdByName(className: string): Promise<IClass> {
		const classId = await this.classModel.findOne({
			className: className
		});
		if (!classId) {
			throw new Error('Class not found');
		}
		return classId;
	}
	async resgisterStudent(data: Partial<Student>): Promise<Student> {
		const details = await this.getClassIdByName(data.className as string);
		if (!details) {
			throw new BadRequestError('Class not found');
		}
		data.classId = details._id;
		data.className = details.className;
		const newStudent = new this.student({
			tuition_fee: details.fee,
			classId: details._id,
			section: details.section,
			...data
		});

		const student = await newStudent.save();

		// const { error: outputError } = studentOutputSchema.validate(
		//   newStudent.toObject(),
		// ); // Assuming Mongoose model for toObject()
		// if (outputError) {
		//   throw new Error(outputError.details[0].message);
		// }
		return student;
	}

	async updateStudentFee(studentId: string, amount: number, remarks: string) {
		const numericAmount = Number(amount);
		const check = await this.student.findById(studentId);
		if (!check) {
			throw new Error('Student not found');
		}
		const classData = await this.classModel.findById(check.classId);
		if (!classData) {
			throw new Error('Class not found');
		}
		const classFee = classData.fee;
		const isNormal = classFee === numericAmount;
		const update = {
			$set: {
				'status.isSpecialCondition': !isNormal,
				tuition_fee: numericAmount
			},
			$push: {
				'status.remarks': remarks
			}
		};
		const student: Student | null = await this.student.findByIdAndUpdate(
			studentId,
			update,
			{
				new: true,
				runValidators: true
			}
		);
		if (!student) {
			throw new Error('Student not found');
		}
		return student;
	}
	async deactivateStudent(studentId: string) {
		return withTransaction(async (session) => {
			const student = await this.student.findByIdAndUpdate(
				studentId,
				{
					$set: {
						status: {
							isActive: false,
							hasLeft: true
						}
					},
					$push: {
						'status.remarks': 'Student has left the school'
					}
				},
				{
					new: true,
					runValidators: true,
					session
				}
			);
			if (!student) {
				throw new BadRequestError('Student not found');
			}
			return student;
		});
	}
	async reactivateStudent(studentId: string) {
		return withTransaction(async (session) => {
			const student = await this.student.findByIdAndUpdate(
				studentId,
				{
					$set: {
						status: {
							isActive: true,
							hasLeft: false,
							remarks: []
						}
					}
				},
				{
					new: true,
					runValidators: true,
					session
				}
			);
			if (!student) {
				throw new BadRequestError('Student not found');
			}
			return student;
		});
	}
	async getWithFeeDocuments(id: string) {
		const student = await this.student.findById(id);
		if (!student) {
			throw new BadRequestError('Student not found');
		}
		const getAllFeeDocuments = await this.feeDocument.find({
			studentId: id
		});
		const classData = await this.classModel.findById(student.classId);
		if (!classData) {
			throw new BadRequestError('Class not found');
		}
		return {
			student,
			class: classData,
			documents: getAllFeeDocuments
		};
	}
}

export const studentService = new Service(
	StudentModel,
	ClassModel,
	paymentModel
);
