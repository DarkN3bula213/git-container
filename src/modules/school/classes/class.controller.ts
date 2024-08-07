import asyncHandler from '@/lib/handlers/asyncHandler';
import { ClassModel } from './class.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { cache } from '@/data/cache/cache.service';
import { generateSubjectId } from './class.utils';
import classService from './class.service';
import { DynamicKey } from '@/data/cache/keys';

/*<!----------------------------------------(GET ROUTES) */
export const findClasses = asyncHandler(async (_req, res) => {
  const key = DynamicKey.CLASS;
  const cachedClasses = await cache.getWithFallback(key, async () => {
    return await ClassModel.find().lean().exec();
  });
  new SuccessResponse('Classes', cachedClasses).send(res);
});
export const addClass = asyncHandler(async (req, res) => {
  const get = await ClassModel.findOne({ className: req.body.className });
  if (get) {
    throw new BadRequestError('Class already exists');
  }
  const classModel = new ClassModel(req.body);
  const data = await classModel.save();
  new SuccessResponse('Class added successfully', data).send(res);
});

export const insertMany = asyncHandler(async (req, res) => {
  const data = await ClassModel.insertMany(req.body);
  new SuccessResponse('Classes added successfully', data).send(res);
});
export const updateClass = asyncHandler(async (req, res) => {
  const data = await ClassModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  new SuccessResponse('Class updated successfully', data).send(res);
});
export const deleteClass = asyncHandler(async (req, res) => {
  const data = await ClassModel.findByIdAndDelete(req.params.id);
  new SuccessResponse(' Class deleted successfully', data).send(res);
});
export const findClassById = asyncHandler(async (req, res) => {
  const data = await ClassModel.findById(req.params.id).lean().exec();
  new SuccessResponse(' Class', data).send(res);
});

export const deleteAll = asyncHandler(async (_req, res) => {
  const data = await ClassModel.deleteMany();

  new SuccessResponse('All classes deleted', data).send(res);
});

export const findClassByName = asyncHandler(async (req, res) => {
  const data = await ClassModel.find({ className: req.params.name })
    .lean()
    .exec();
  if (data.length === 0) {
    throw new BadRequestError('Class not found');
  }
  new SuccessResponse(' Class', data).send(res);
});

export const updateClassFee = asyncHandler(async (req, res) => {
  const data = await ClassModel.find({ className: req.params.name })
    .lean()
    .exec();
  if (data.length === 0) {
    throw new BadRequestError('Class not found');
  }
  const result = await ClassModel.findByIdAndUpdate(data[0]._id, req.body, {
    new: true,
  });
  new SuccessResponse('Class updated successfully', result).send(res);
});

/*<!-- 1. POST  ---------------------------( Add Subjects To Class )->*/

export const addSubjectToClass = asyncHandler(async (req, res) => {
  const { subjects } = req.body;
  const { classId } = req.params;

  const updatedClass = await classService.addSubjects(classId, subjects);
  new SuccessResponse('Subject added successfully', updatedClass).send(res);
});

/*<!-- 1. POST  ---------------------------( Remove Subjects From Class )->*/

export const removeSubjectFromClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { subjectId } = req.body;
  const response = await classService.removeClassSubjects(classId, subjectId);
  new SuccessResponse('Subject removed successfully', response).send(res);
});

/*<!-- 1. POST  ---------------------------( Add Class Teacher )->*/

export const addClassTeacher = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { data } = req.body;
  const { teacherId, teacherName } = data;

  console.log(`${teacherId} ${teacherName}`, req.body);

  const response = await classService.addClassTeacher(
    classId,
    teacherId,
    teacherName,
  );
  new SuccessResponse('Teacher added successfully', response).send(res);
});
/*<!----------------------------------------(Add Teacher) */
export const addTeacher = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { data } = req.body;
  const { teacherId, teacherName } = data;

  console.log(`${teacherId} ${teacherName}`, req.body);

  const response = await classService.addClassTeacher(
    classId,
    teacherId,
    teacherName,
  );
  new SuccessResponse('Teacher added successfully', response).send(res);
});
