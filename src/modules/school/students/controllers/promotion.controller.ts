import { SuccessResponse } from '@/lib/api/ApiResponse';
import asyncHandler from '@/lib/handlers/asyncHandler';
import promotionService from '../services/promotion.service';
import { Student } from '../student.interface';

export const promoteStudents = asyncHandler(async (req, res) => {
	const { studentIds, targetId, section } = req.body;

	const updatedStudents = (await promotionService.promoteStudent(
		studentIds,
		targetId,
		section
	)) as unknown as Promise<Student[]>;

	return new SuccessResponse(
		'Students promoted successfully',
		updatedStudents
	).send(res);
});

export const rollbackPromotion = asyncHandler(async (req, res) => {
	const { studentIds } = req.body;
	const updatedStudents =
		await promotionService.rollBackPromotion(studentIds);
	return new SuccessResponse(
		'Students rolled back successfully',
		updatedStudents
	).send(res);
});
