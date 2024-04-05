import asyncHandler from '@/lib/handlers/asyncHandler';
import TeacherModel from './teacher.model';
import {
  BadRequestError,
  NotFoundError,
  SuccessMsgResponse,
  SuccessResponse,
} from '@/lib/api';

import { Logger } from '@/lib/logger';
import { ObjectId } from 'mongoose';

const logger = new Logger(__filename);

/*
<!-- 1. Create  ---------------------------->
*/

export const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await TeacherModel.create(req.body);
  return new SuccessResponse('Teacher created successfully', teacher).send(res);
});
export const createManyTeachers = asyncHandler(async (req, res) => {
  const teachers = await TeacherModel.insertMany(req.body);
  return new SuccessResponse('Teachers created successfully', teachers).send(
    res,
  );
});

/*
<!-- 2. Read ---------------------------->
*/

export const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await TeacherModel.findById(req.params.id);
  if (!teacher) {
    throw new NotFoundError('Teacher not found');
  }
  return new SuccessResponse('Teacher fetched successfully', teacher).send(res);
});
export const getTeachersSorted = asyncHandler(async (req, res) => {
  const teachers = await TeacherModel.find().sort({ first_name: 1 });
  return new SuccessResponse('Teachers fetched successfully', teachers).send(
    res,
  );
});

/*
<!-- 3. Update ---------------------------->
*/
export const updateTeacherById = asyncHandler(async (req, res) => {
  const teacher = await TeacherModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true },
  );
  if (!teacher) {
    throw new NotFoundError('Teacher not found');
  }
  return new SuccessResponse('Teacher updated successfully', teacher).send(res);
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
export const resetTeachers = asyncHandler(async (req, res) => {
  await TeacherModel.deleteMany({});
  res.json({ message: 'All teachers deleted successfully' });
});
