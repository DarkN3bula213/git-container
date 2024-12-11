import { SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Request, Response } from 'express';
import { ExamType } from './exam.model';
import ResultService from './exam.service';

export const addOrUpdateClassResults = asyncHandler(
	async (req: Request, res: Response) => {
		const { classId, examType, session, examDate, studentResults } =
			req.body;

		// Convert examType from string if necessary
		if (!Object.values(ExamType).includes(examType)) {
			throw new Error('Invalid examType');
		}

		const results = await ResultService.addOrUpdateResultsForClass(
			classId,
			examType,
			session,
			new Date(examDate),
			studentResults
		);

		new SuccessResponse('Class results updated successfully', results).send(
			res
		);
	}
);

export const addOrUpdateStudentResults = asyncHandler(
	async (req: Request, res: Response) => {
		const { studentId } = req.params;
		const { classId, examType, session, examDate, subjects } = req.body;

		const result = await ResultService.addOrUpdateResultsForStudent(
			studentId,
			classId,
			examType,
			session,
			new Date(examDate),
			subjects
		);

		new SuccessResponse(
			'Student results updated successfully',
			result
		).send(res);
	}
);

export const removeOrUpdateSubjectForStudent = asyncHandler(
	async (req: Request, res: Response) => {
		const { studentId, subjectId } = req.params;
		const { examType, academicYear, remove, updates } = req.body;

		const result = await ResultService.removeOrUpdateSubjectForStudent(
			studentId,
			examType,
			academicYear,
			subjectId,
			remove,
			updates
		);

		new SuccessResponse('Subject updated successfully', result).send(res);
	}
);

export const getStudentResult = asyncHandler(
	async (req: Request, res: Response) => {
		const { studentId } = req.params;
		const { examType, academicYear } = req.query;

		const result = await ResultService.getStudentResult(
			studentId,
			examType as ExamType,
			academicYear as string
		);

		new SuccessResponse('Student result fetched successfully', result).send(
			res
		);
	}
);
