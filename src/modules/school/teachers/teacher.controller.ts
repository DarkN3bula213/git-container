import { NotFoundError, SuccessMsgResponse, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import TeacherModel from './teacher.model';

const logger = new Logger('TeacherController');

/*
<!-- 1. Create  ---------------------------->
*/

export const createTeacher = asyncHandler(async (req, res) => {
	const teacher = (await TeacherModel.create(req.body)) as object;
	return new SuccessResponse('Teacher created successfully', teacher).send(
		res
	);
});
export const createManyTeachers = asyncHandler(async (req, res) => {
	const teachers = (await TeacherModel.insertMany(req.body)) as object[];
	return new SuccessResponse('Teachers created successfully', teachers).send(
		res
	);
});

/*
<!-- 2. Read ---------------------------->
*/

export const getTeacherById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	logger.info(id);
	const teacher = (await TeacherModel.findOne({ _id: id })) as object;

	if (!teacher) {
		throw new NotFoundError('Teacher not found');
	}
	return new SuccessResponse('Teacher fetched successfully', teacher).send(
		res
	);
});
export const getTeachersSorted = asyncHandler(async (_req, res) => {
	const teachers = (await TeacherModel.find().sort({
		first_name: 1
	})) as object[];
	return new SuccessResponse('Teachers fetched successfully', teachers).send(
		res
	);
});

/*
<!-- 3. Update ---------------------------->
*/
export const updateTeacherById = asyncHandler(async (req, res) => {
	const teacher = (await TeacherModel.findByIdAndUpdate(
		req.params.id,
		req.body,
		{ new: true }
	)) as object;
	if (!teacher) {
		throw new NotFoundError('Teacher not found');
	}
	return new SuccessResponse('Teacher updated successfully', teacher).send(
		res
	);
});

/*
<!-- 4. Delete ---------------------------->
*/
export const deleteTeacherById = asyncHandler(async (req, res) => {
	const teacher = await TeacherModel.findByIdAndDelete(req.params.id);
	if (!teacher) {
		throw new NotFoundError('Teacher not found');
	}
	return new SuccessMsgResponse('Teacher deleted successfully').send(res);
});
export const resetTeachers = asyncHandler(async (_req, res) => {
	await TeacherModel.deleteMany({});
	res.json({ message: 'All teachers deleted successfully' });
});
