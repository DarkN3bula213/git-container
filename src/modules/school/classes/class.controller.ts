import asyncHandler from '@/lib/handlers/asyncHandler';
import { ClassModel } from './class.model';

export const addClass = asyncHandler(async (req, res) => {
  const classModel = new ClassModel(req.body);
  const data = await classModel.save();
  res.json(data);
});

export const insertMany = asyncHandler(async (req, res) => {
  const data = await ClassModel.insertMany(req.body);
  res.json(data);
});
export const updateClass = asyncHandler(async (req, res) => {
  const data = await ClassModel.findByIdAndUpdate(req.params.id, req.body);
  res.json(data);
});
export const deleteClass = asyncHandler(async (req, res) => {
  const data = await ClassModel.findByIdAndDelete(req.params.id);
  res.json(data);
});
export const findClassById = asyncHandler(async (req, res) => {
  const data = await ClassModel.findById(req.params.id).lean().exec();
  res.json(data);
});
export const findClasses = asyncHandler(async (req, res) => {
  const data = await ClassModel.find().lean().exec();
  res.json(data);
});
