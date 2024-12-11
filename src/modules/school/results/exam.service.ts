// Assuming you have a Student model
import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import { ClientSession, Types } from 'mongoose';
import StudentModel from '../students/student.model';
import { ExamStatus, ExamType, IResult, Result } from './exam.model';

interface SubjectMarksInput {
	subjectId: string;
	marksSecured?: number;
	components?: { name: string; marksSecured: number }[];
	examStatus?: ExamStatus;
	statusReason?: string;
	remarks?: string;
	maxMarks?: number; // Optional if client doesn't supply, we may fetch from Subject model
}

interface StudentResultInput {
	studentId: string;
	subjects: SubjectMarksInput[];
}

class ResultService {
	/**
	 * Add or update results for multiple students for a single class/exam combination.
	 * Useful scenario:
	 *   - Class teacher has marks for a single subject for the entire class and wants to enter them all at once.
	 *   - Or multiple subjects at once for multiple students.
	 */
	public static async addOrUpdateResultsForClass(
		classId: string,
		examType: ExamType,
		academicYear: string,
		examDate: Date,
		studentResults: StudentResultInput[]
	): Promise<IResult[]> {
		return withTransaction(async (session: ClientSession) => {
			const updatedResults: IResult[] = [];

			// Validate the class
			// (Optionally you can check if classId is valid by querying Class model if needed.)

			for (const sr of studentResults) {
				const studentId = new Types.ObjectId(sr.studentId);

				// Validate student
				const student =
					await StudentModel.findById(studentId).session(session);
				if (!student) {
					throw new BadRequestError(
						`Student ${sr.studentId} not found`
					);
				}

				// Ensure student belongs to the same class if that's a requirement
				// if (!student.classId.equals(classId)) { ... }

				const result = await this.upsertStudentResult(
					studentId,
					classId,
					examType,
					academicYear,
					examDate,
					sr.subjects,
					session
				);

				updatedResults.push(result);
			}

			return updatedResults;
		});
	}

	/**
	 * Add or update results for a single student.
	 * Useful scenario:
	 *   - The teacher updates results for multiple subjects for a single student at once.
	 */
	public static async addOrUpdateResultsForStudent(
		studentId: string,
		classId: string,
		examType: ExamType,
		academicYear: string,
		examDate: Date,
		subjects: SubjectMarksInput[]
	): Promise<IResult> {
		return withTransaction(async (session: ClientSession) => {
			// Validate student
			const studentObjId = new Types.ObjectId(studentId);
			const student =
				await StudentModel.findById(studentObjId).session(session);
			if (!student) {
				throw new BadRequestError(`Student ${studentId} not found`);
			}

			const result = await this.upsertStudentResult(
				studentObjId,
				classId,
				examType,
				academicYear,
				examDate,
				subjects,
				session
			);

			return result;
		});
	}

	/**
	 * Remove or update a particular subject result from a student's record.
	 * Useful scenario:
	 *   - Teacher wants to correct or remove previously entered marks for a subject.
	 */
	public static async removeOrUpdateSubjectForStudent(
		studentId: string,
		examType: ExamType,
		academicYear: string,
		subjectId: string,
		remove = false,
		updates?: Partial<SubjectMarksInput>
	): Promise<IResult> {
		return withTransaction(async (session: ClientSession) => {
			const studentObjId = new Types.ObjectId(studentId);
			const result = (await Result.findOne({
				studentId: studentObjId,
				examType,
				academicYear
			}).session(session)) as IResult;

			if (!result) {
				throw new BadRequestError(
					'Result record not found for this student and exam'
				);
			}

			const subjObjId = new Types.ObjectId(subjectId);
			const subjectIndex = result.subjects.findIndex((s) =>
				s.subjectId.equals(subjObjId)
			);
			if (subjectIndex === -1) {
				throw new BadRequestError(
					"Subject not found in the student's result record"
				);
			}

			if (remove) {
				// Remove the subject entry
				result.subjects.splice(subjectIndex, 1);
			} else if (updates) {
				// Update the subject entry with provided data
				const subjectEntry = result.subjects[subjectIndex];

				if (updates.marksSecured !== undefined) {
					if (
						updates.maxMarks &&
						updates.marksSecured > updates.maxMarks
					) {
						throw new BadRequestError(
							'Marks secured cannot exceed max marks'
						);
					}
					subjectEntry.marksSecured = updates.marksSecured;
				}

				if (updates.components) {
					subjectEntry.components = updates.components;
				}

				if (updates.examStatus !== undefined) {
					subjectEntry.examStatus = updates.examStatus;
					if (
						updates.examStatus !== ExamStatus.COMPLETED &&
						!updates.statusReason
					) {
						throw new BadRequestError(
							'Status reason is required for non-COMPLETED statuses'
						);
					}
					subjectEntry.statusReason = updates.statusReason;
				}

				if (updates.remarks !== undefined) {
					subjectEntry.remarks = updates.remarks;
				}

				if (updates.maxMarks !== undefined) {
					if (
						updates.maxMarks <= 0 ||
						(subjectEntry.marksSecured &&
							updates.maxMarks < subjectEntry.marksSecured)
					) {
						throw new BadRequestError('Invalid max marks');
					}
					(subjectEntry as any).maxMarks = updates.maxMarks;
				}
			}

			await result.save({ session });
			return result;
		});
	}

	/**
	 * Helper function to upsert a student's result record and add/update multiple subjects.
	 */
	private static async upsertStudentResult(
		studentId: Types.ObjectId,
		classId: string,
		examType: ExamType,
		session: string,
		examDate: Date,
		subjects: SubjectMarksInput[],
		transactionSession: ClientSession
	): Promise<IResult> {
		let result = await Result.findOne({
			studentId,
			examType,
			session
		}).session(transactionSession);

		if (!result) {
			result = new Result({
				studentId,
				classId,
				examType,
				session,
				examDate,
				subjects: [],
				isPublished: false
			});
		}

		// Validate and upsert subjects
		for (const s of subjects) {
			const subjectObjId = new Types.ObjectId(s.subjectId);
			// Optionally fetch Subject for validation or maxMarks if needed:
			// const subjectDoc = await Subject.findById(subjectObjId).session(transactionSession);
			// if (!subjectDoc) { throw new NotFoundError('Invalid subjectId'); }

			// Check if subject already exists in result
			const existingIdx = result.subjects.findIndex((sub) =>
				sub.subjectId.equals(subjectObjId)
			);
			if (existingIdx > -1) {
				// Update existing subject
				result.subjects[existingIdx].marksSecured = s.marksSecured;
				result.subjects[existingIdx].components = s.components || [];
				result.subjects[existingIdx].examStatus =
					s.examStatus || ExamStatus.COMPLETED;
				if (
					result.subjects[existingIdx].examStatus !==
						ExamStatus.COMPLETED &&
					!s.statusReason
				) {
					throw new BadRequestError(
						'Status reason is required for non-COMPLETED statuses'
					);
				}
				result.subjects[existingIdx].statusReason = s.statusReason;
				result.subjects[existingIdx].remarks = s.remarks;
				(result.subjects[existingIdx] as any).maxMarks =
					s.maxMarks || 100; // default to 100 if not provided
			} else {
				// Add new subject
				const examStatus = s.examStatus || ExamStatus.COMPLETED;
				if (examStatus !== ExamStatus.COMPLETED && !s.statusReason) {
					throw new BadRequestError(
						'Status reason is required for non-COMPLETED statuses'
					);
				}

				result.subjects.push({
					subjectId: subjectObjId,
					marksSecured: s.marksSecured,
					components: s.components || [],
					examStatus,
					statusReason: s.statusReason,
					remarks: s.remarks,
					maxMarks: s.maxMarks || 100
				});
			}
		}

		await result.save({ session: transactionSession });
		return result;
	}

	/**
	 * Fetch a student's result.
	 * Useful to display results to teachers or for client verification.
	 */
	public static async getStudentResult(
		studentId: string,
		examType: ExamType,
		session: string
	): Promise<IResult> {
		const studentObjId = new Types.ObjectId(studentId);
		const result = await Result.findOne({
			studentId: studentObjId,
			examType,
			session
		})
			.populate('studentId', 'name registration_no')
			.populate('subjects.subjectId', 'label code') // Optionally populate subject details
			.exec();

		if (!result) {
			throw new BadRequestError('Result not found');
		}

		return result;
	}
}

export default ResultService;
