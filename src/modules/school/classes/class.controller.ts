import asyncHandler from '@/lib/handlers/asyncHandler';
import { ClassModel } from './class.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { cache } from '@/data/cache/cache.service';

/*<!----------------------------------------(GET ROUTES) */
export const findClasses = asyncHandler(async (_req, res) => {
  const key = 'classes';
  const cachedClasses = await cache.get(key, async () => {
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
