import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import dayjs from 'dayjs';
import { Types } from 'mongoose';
import ClassModel from '../classes/class.model';
import StudentModel from '../students/student.model';
import ExamModel, { ExamStatus, ExamType, SubjectMarks } from './exam.model';

const logger = new Logger('exam.controller');

interface IAddStudentRequestBody {
	marks: [
		{
			subjectId: string;
			subjectName: string;
			totalMarks: number;
			obtainedMarks: number;
			isComplete: boolean;
			isAbsent: boolean;
			subComponents?: Array<{
				name: string;
				totalMarks: number;
				obtainedMarks: number;
				isComplete: boolean;
				isAbsent: boolean;
			}>;
		}
	];
	studentId: string;
	classId: string;
}

export const addStudentResult = asyncHandler(async (req, res) => {
	const { marks, studentId, classId } = req.body as IAddStudentRequestBody;

	await withTransaction(async (session) => {
		// 1. Validate student exists and belongs to the specified class
		const student = await StudentModel.findById(studentId)
			.populate<{
				classId: { _id: Types.ObjectId };
			}>('classId')
			.session(session);

		if (!student) {
			throw new BadRequestError('Student not found');
		}
		if (student.classId._id.toString() !== classId) {
			throw new BadRequestError(
				'Student does not belong to the specified class'
			);
		}

		// 2. Get class details with subjects
		const classDetails =
			await ClassModel.findById(classId).session(session);
		if (!classDetails) {
			throw new BadRequestError('Class not found');
		}

		// 3. Create a map of valid subjects from class
		const validSubjectMap = new Map(
			classDetails.subjects.map((subject) => [subject.subjectId, subject])
		);

		// 4. Validate all submitted subjects are valid for the class
		for (const mark of marks) {
			const validSubject = validSubjectMap.get(mark.subjectId);
			if (!validSubject) {
				throw new BadRequestError(
					`Invalid subject ${mark.subjectName} for this class`
				);
			}
			if (validSubject.name !== mark.subjectName) {
				throw new BadRequestError(
					`Subject name mismatch: ${mark.subjectName} should be ${validSubject.name}`
				);
			}
		}

		const currentAcademicYear = dayjs().format('YYYY-MM-DD');

		// 5. Check if an entry already exists for this academic year
		const existingResult = await ExamModel.findOne({
			studentId,
			examType: ExamType.ANNUAL,
			academicYear: currentAcademicYear
		}).session(session);

		// 6. Transform marks data to SubjectMarks format
		const subjectMarks: SubjectMarks[] = marks.map((mark) => ({
			code: mark.subjectId,
			title: mark.subjectName,
			obtainedMarks: mark.obtainedMarks,
			totalMarks: mark.totalMarks,
			examStatus: mark.isComplete
				? mark.isAbsent
					? ExamStatus.ABSENT
					: ExamStatus.COMPLETED
				: ExamStatus.DEFERRED,
			components: mark.subComponents?.map((comp) => ({
				name: comp.name,
				obtainedMarks: comp.obtainedMarks,
				totalMarks: comp.totalMarks,
				examStatus: comp.isComplete
					? comp.isAbsent
						? ExamStatus.ABSENT
						: ExamStatus.COMPLETED
					: ExamStatus.DEFERRED
			})),
			lastUpdated: new Date()
		}));

		let result;
		if (existingResult) {
			// 7. Update existing result document
			const updatedSubjects = [...existingResult.subjects];

			// Update or add new subjects
			let hasChanges = false;
			subjectMarks.forEach((newMark) => {
				const existingIndex = updatedSubjects.findIndex(
					(s) => s.code === newMark.code
				);
				if (existingIndex !== -1) {
					const existingMark = updatedSubjects[existingIndex];
					// Check if there are actual changes in the marks
					if (
						existingMark.obtainedMarks !== newMark.obtainedMarks ||
						existingMark.totalMarks !== newMark.totalMarks ||
						existingMark.examStatus !== newMark.examStatus ||
						JSON.stringify(existingMark.components) !==
							JSON.stringify(newMark.components)
					) {
						updatedSubjects[existingIndex] = {
							...existingMark,
							...newMark
						};
						hasChanges = true;
					}
				} else {
					// Add new subject
					updatedSubjects.push(newMark);
					hasChanges = true;
				}
			});

			if (!hasChanges) {
				logger.info(
					`No changes detected for student ${studentId}'s result`
				);
				new SuccessResponse('No changes needed', existingResult).send(
					res
				);
				return existingResult;
			}

			result = await ExamModel.findByIdAndUpdate(
				existingResult._id,
				{
					$set: {
						subjects: updatedSubjects,
						updatedAt: new Date()
					}
				},
				{ new: true, session }
			);

			logger.info(`Updated exam result for student ${studentId}`);
			new SuccessResponse(
				'Student result updated successfully',
				result
			).send(res);
		} else {
			// 8. Create new result document
			result = await ExamModel.create(
				[
					{
						studentId,
						classId,
						examType: ExamType.ANNUAL,
						academicYear: currentAcademicYear,
						subjects: subjectMarks
					}
				],
				{ session }
			);

			logger.info(`Created new exam result for student ${studentId}`);
			new SuccessResponse(
				'Student result added successfully',
				result
			).send(res);
		}

		return result;
	});
});

// export const updateStudentResult = asyncHandler(async (req, res) => {});

export const getStudentResult = asyncHandler(async (req, res) => {
	const { studentId } = req.params;
	const key = getDynamicKey(DynamicKey.RESULT, studentId);
	const result = await cache.getWithFallback(key, async () => {
		const result = await ExamModel.find({
			studentId,
			examType: ExamType.ANNUAL,
			academicYear: dayjs().format('YYYY-MM-DD')
		});
		return result;
	});
	logger.info({
		event: 'Student result fetched',
		StudentId: studentId,
		Result: result
	});

	new SuccessResponse(
		'Student result fetched successfully',
		result ?? []
	).send(res);
});

export const deleteStudentResult = asyncHandler(async (req, res) => {
	const { studentId } = req.params;
	const { examType, academicYear } = req.query;

	const result = await ExamModel.deleteOne({
		studentId,
		examType,
		academicYear
	});

	new SuccessResponse('Student result deleted successfully', result).send(
		res
	);
});

// export const addOrUpdateClassResults = asyncHandler(
// 	async (req: Request, res: Response) => {
// 		const { classId, examType, session, examDate, studentResults } =
// 			req.body;

// 		// Convert examType from string if necessary
// 		if (!Object.values(ExamType).includes(examType)) {
// 			throw new Error('Invalid examType');
// 		}

// 		const results = await ResultService.addOrUpdateResultsForClass(
// 			classId,
// 			examType,
// 			session,
// 			new Date(examDate),
// 			studentResults
// 		);

// 		new SuccessResponse('Class results updated successfully', results).send(
// 			res
// 		);
// 	}
// );

// export const addOrUpdateStudentResults = asyncHandler(
// 	async (req: Request, res: Response) => {
// 		const { studentId } = req.params;
// 		const { classId, examType, session, examDate, subjects } = req.body;

// 		const result = await ResultService.addOrUpdateResultsForStudent(
// 			studentId,
// 			classId,
// 			examType,
// 			session,
// 			new Date(examDate),
// 			subjects
// 		);

// 		new SuccessResponse(
// 			'Student results updated successfully',
// 			result
// 		).send(res);
// 	}
// );

// export const removeOrUpdateSubjectForStudent = asyncHandler(
// 	async (req: Request, res: Response) => {
// 		const { studentId, subjectId } = req.params;
// 		const { examType, academicYear, remove, updates } = req.body;

// 		const result = await ResultService.removeOrUpdateSubjectForStudent(
// 			studentId,
// 			examType,
// 			academicYear,
// 			subjectId,
// 			remove,
// 			updates
// 		);

// 		new SuccessResponse('Subject updated successfully', result).send(res);
// 	}
// );

// export const getStudentResult = asyncHandler(
// 	async (req: Request, res: Response) => {
// 		const { studentId } = req.params;
// 		const { examType, academicYear } = req.query;

// 		const result = await ResultService.getStudentResult(
// 			studentId,
// 			examType as ExamType,
// 			academicYear as string
// 		);

// 		new SuccessResponse('Student result fetched successfully', result).send(
// 			res
// 		);
// 	}
// );
