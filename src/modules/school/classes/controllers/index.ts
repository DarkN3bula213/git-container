import { cache } from '@/data/cache/cache.service';
import { DynamicKey } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger/logger';
import { User } from '@/modules/auth/users/user.model';
import classService from '../class.service';
import { ClassWithSectionCounts } from '../interfaces';
import classSubjectService from '../services/class.subject.service';

const logger = new Logger('modules/school/classes/controllers/index');
/*<!----------------------------------------(Get All Classes) */
/**
 * @description Get all classes
 */

export const getAllClasses = asyncHandler(async (_req, res) => {
	const key = DynamicKey.CLASS;
	const data = await cache.getWithFallback(key, async () => {
		return await classService.getAllClasses();
	});
	return new SuccessResponse('Classes fetched successfully', data).send(res);
});

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

/*<!----------------------------------------(Add Class Sections) */
/**
 * @description Add class sections
 * @body - The sections to add
 */

export const addClassSections = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const sections = req.body;
	const updatedClass = await classSubjectService.updateClassSections(
		id,
		sections
	);
	new SuccessResponse('Class sections added successfully', updatedClass).send(
		res
	);
});

/*<!----------------------------------------(Remove Class Sections) */
/**
 * @description Remove class sections
 * @param id - The id of the class
 * @query - The section to remove
 */

export const removeClassSections = asyncHandler(async (req, res) => {
	const { classId } = req.params;
	const { section } = req.query;

	if (!section) {
		throw new BadRequestError('Section is required');
	}
	const sectionId = section as string;

	logger.info(`Removing section ${sectionId} from class ${classId}`);

	const updatedClass = await classSubjectService.removeSection(
		classId,
		sectionId
	);
	new SuccessResponse(
		'Class sections deleted successfully',
		updatedClass
	).send(res);
});
