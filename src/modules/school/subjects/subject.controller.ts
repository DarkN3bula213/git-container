import { cache } from '@/data/cache/cache.service';
import { DynamicKey } from '@/data/cache/keys';
import { getDynamicKey } from '@/data/cache/keys';
import { BadRequestError } from '@/lib/api';
import { SuccessResponse } from '@/lib/api/ApiResponse';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Subject } from './subject.model';

export const getClassSubjects = asyncHandler(async (req, res) => {
	const { classId } = req.params;
	const key = getDynamicKey(DynamicKey.CLASS_SUBJECTS, classId);

	const subjects = await cache.getWithFallback(key, async () => {
		return await Subject.find({ classId, isActive: true })
			.sort('orderIndex')
			.lean();
	});

	if (!subjects.length) {
		throw new BadRequestError('No subjects found');
	}

	new SuccessResponse('Subjects fetched successfully', subjects).send(res);
});

export const getSubjects = asyncHandler(async (req, res) => {
	const key = DynamicKey.CLASS_SUBJECTS;

	const subjects = await cache.getWithFallback(key, async () => {
		return await Subject.find({ isActive: true }).lean();
	});

	new SuccessResponse('Subjects fetched successfully', subjects).send(res);
});
