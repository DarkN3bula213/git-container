// // services/result.service.ts
// import { convertToObjectId, withTransaction } from '@/data/database/db.utils';
// import { BadRequestError } from '@/lib/api';
// import { Logger } from '@/lib/logger';
// import { ClientSession, ObjectId } from 'mongoose';
// import Student from '../students/student.model';
// import { Subject } from '../subjects/subject.model';
// import {
// 	ExamStatus,
// 	Outcome,
// 	Result,
// 	ResultType,
// 	SubjectResultBase
// } from './result.model';

// const logger = new ProductionLogger('ResultService');

// // Input types for different operations

// type SingleSubjectInput = SubjectResultBase & {
// 	studentId?: string;
// 	subjectId?: string;
// 	totalMarks?: number;
// };

// interface BatchSubjectInput {
// 	subjectId: string;
// 	subjectCode: string;
// 	subjectName: string;
// 	students: Array<{
// 		studentId: string;
// 		marksSecured: number;
// 		examStatus?: ExamStatus;
// 		remarks?: string;
// 		components?: {
// 			theory?: { marksSecured: number };
// 			practical?: { marksSecured: number };
// 		};
// 	}>;
// }

// interface MultipleSubjectsInput {
// 	studentId: string;
// 	subjects: Array<{
// 		subjectId: string;
// 		marksSecured: number;
// 		examStatus?: ExamStatus;
// 		remarks?: string;
// 		components?: {
// 			theory?: { marksSecured: number };
// 			practical?: { marksSecured: number };
// 		};
// 	}>;
// }

// interface BatchResultsInput {
// 	students: Array<{
// 		studentId: string;
// 		subjects: Array<{
// 			subjectId: string;
// 			marksSecured: number;
// 			examStatus?: ExamStatus;
// 			remarks?: string;
// 			components?: {
// 				theory?: { marksSecured: number };
// 				practical?: { marksSecured: number };
// 			};
// 		}>;
// 	}>;
// }

// interface ResultContextData {
// 	academicYear: string;
// 	examType: string;
// 	examDate: Date;
// 	invigilatorName: string;
// 	gradedBy: string;
// }

// export class ResultService {
// 	private async getOrCreateResult(
// 		studentId: string,
// 		contextData: ResultContextData,
// 		session: ClientSession
// 	): Promise<ResultType> {
// 		const student = await Student.findById(studentId)
// 			.select('name registration_no className classId section')
// 			.session(session)
// 			.lean();

// 		if (!student) {
// 			throw new Error(`Student not found: ${studentId}`);
// 		}

// 		let result = await Result.findOne({
// 			studentId,
// 			academicYear: contextData.academicYear,
// 			examType: contextData.examType
// 		}).session(session);

// 		if (!result) {
// 			const results = await Result.create(
// 				[
// 					{
// 						academicYear: contextData.academicYear,
// 						examType: contextData.examType,
// 						examDate: contextData.examDate,
// 						studentId: student._id,
// 						registrationNo: student.registration_no,
// 						studentName: student.name,
// 						classId: student.classId,
// 						className: student.className,
// 						section: student.section,
// 						invigilatorName: contextData.invigilatorName,
// 						gradedBy: contextData.gradedBy,
// 						subjects: [],
// 						isPublished: false
// 					}
// 				],
// 				{ session }
// 			);
// 			result = results[0];
// 		}

// 		return result;
// 	}

// 	private async validateAndGetSubject(
// 		subjectId: string,
// 		classId: string,
// 		session: ClientSession
// 	) {
// 		const subject = await Subject.findOne({
// 			_id: subjectId,
// 			classId,
// 			isActive: true
// 		})
// 			.session(session)
// 			.lean();

// 		if (!subject) {
// 			throw new Error(`Invalid subject ${subjectId} for class`);
// 		}

// 		return subject;
// 	}

// 	// 1. Add single subject result for a student
// 	async addSingleSubjectResult(
// 		input: SingleSubjectInput & ResultContextData
// 	): Promise<ResultType> {
// 		return withTransaction(async (session) => {
// 			if (!input.studentId) {
// 				throw new BadRequestError('Student ID is required');
// 			}
// 			const result = await this.getOrCreateResult(
// 				input.studentId,
// 				input,
// 				session
// 			);

// 			const subject = await this.validateAndGetSubject(
// 				input.subjectId,
// 				result.classId.toString(),
// 				session
// 			);

// 			const subjectResult = {
// 				subjectId: subject._id,
// 				subjectCode: subject.code,
// 				subjectName: subject.label,
// 				marksSecured: input.marksSecured,

// 				examStatus: input.examStatus || ExamStatus.COMPLETED,

// 				outcome: 'PASS' as Outcome, // Will be determined
// 				remarks: input.remarks,
// 				components: input.components
// 			};

// 			const subjectIndex = result.subjects.findIndex(
// 				(s) => s.subjectId.toString() === subject._id.toString()
// 			);

// 			if (subjectIndex >= 0) {
// 				result.subjects[subjectIndex] = {
// 					...result.subjects[subjectIndex],
// 					...subjectResult
// 				};
// 			} else {
// 				result.subjects.push(subjectResult);
// 			}

// 			return await result.save({ session });
// 		});
// 	}

// 	// 2. Add results for multiple students in a single subject
// 	async addBatchSubjectResults(
// 		input: BatchSubjectInput & ResultContextData
// 	): Promise<ResultType[]> {
// 		return withTransaction(async (_session) => {
// 			const results = await Promise.all(
// 				input.students.map(async (studentInput) => {
// 					return this.addSingleSubjectResult({
// 						...studentInput,
// 						...input,
// 						outcome: 'PASS' as Outcome
// 					});
// 				})
// 			);

// 			return results;
// 		});
// 	}

// 	// 3. Add multiple subject results for a single student
// 	async addMultipleSubjectsForStudent(
// 		input: MultipleSubjectsInput & ResultContextData
// 	): Promise<ResultType> {
// 		return withTransaction(async (session) => {
// 			const result = await this.getOrCreateResult(
// 				input.studentId,
// 				input,
// 				session
// 			);

// 			await Promise.all(
// 				input.subjects.map(async (subjectInput) => {
// 					const subject = await this.validateAndGetSubject(
// 						subjectInput.subjectId,
// 						result.classId.toString(),
// 						session
// 					);

// 					const subjectResult = {
// 						subjectId: subject._id,
// 						subjectCode: subject.code,
// 						subjectName: subject.label,
// 						marksSecured: subjectInput.marksSecured,
// 						examStatus:
// 							subjectInput.examStatus || ExamStatus.COMPLETED,
// 						grade: '',
// 						outcome: 'PASS' as Outcome,
// 						remarks: subjectInput.remarks,
// 						components: subjectInput.components
// 					};

// 					const subjectIndex = result.subjects.findIndex(
// 						(s) => s.subjectId.toString() === subject._id.toString()
// 					);

// 					if (subjectIndex >= 0) {
// 						result.subjects[subjectIndex] = {
// 							...result.subjects[subjectIndex],
// 							...subjectResult
// 						};
// 					} else {
// 						result.subjects.push(subjectResult);
// 					}
// 				})
// 			);

// 			return await result.save({ session });
// 		});
// 	}

// 	// 4. Add multiple subjects for multiple students
// 	async addBatchResults(
// 		input: BatchResultsInput & ResultContextData
// 	): Promise<ResultType[]> {
// 		return withTransaction(async (_session) => {
// 			const results = await Promise.all(
// 				input.students.map(async (studentInput) => {
// 					return this.addMultipleSubjectsForStudent({
// 						...studentInput,
// 						...input
// 					});
// 				})
// 			);

// 			return results;
// 		});
// 	}
// }
