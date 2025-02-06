import { SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { User } from '@/modules/auth/users/user.model';
import classService from '../class.service';
import { ClassWithSectionCounts } from '../interfaces';

/*<!----------------------------------------(Get Classes With Section Counts) */
/**
 * @description Get classes with appended sections field
 * @Section - The number of sections in the class
 * @totalStudents - The total number of students in the class
 * @Sections - The sections in the class plus the number of students in each section
 */

export const getClassesWithSectionCounts = asyncHandler(async (_req, res) => {
	const classesWithCounts =
		(await classService.getClassesWithSectionCounts()) as ClassWithSectionCounts[];
	return new SuccessResponse(
		'Classes fetched successfully',
		classesWithCounts
	).send(res);
});

/*<!----------------------------------------(Update Class Fields) */
/**
 * @description Update class fields
 * @body - The fields to update
 */

export const updateClassFields = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const updates = req.body;
	const user = req.user as User;
	const updatedClass = await classService.updateClass(id, updates, user);
	new SuccessResponse('Class updated successfully', updatedClass).send(res);
});
