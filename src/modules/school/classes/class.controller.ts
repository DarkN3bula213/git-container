import asyncHandler from '@/lib/handlers/asyncHandler';
import {
  ClassModel,
  insertMany as bulk,
  updateClass as update,
  deleteClass as del,
  findClassById as findById,
  findClasses as findAll,
} from './class.model';

export const addClass = asyncHandler(async (req, res) => {
  const classModel = new ClassModel(req.body);
  const data = await classModel.save();
  res.json(data);
});

export const insertMany = asyncHandler(async (req, res) => {
  const data = await bulk(req.body);
  res.json(data);
});
export const updateClass = asyncHandler(async (req, res) => {
  const data = await update(req.params.id, req.body);
  res.json(data);
});
export const deleteClass = asyncHandler(async (req, res) => {
  const data = await del(req.params.id);
});
export const findClassById = asyncHandler(async (req, res) => {
  const data = await findById(req.params.id);
});
export const findClasses = asyncHandler(async (req, res) => {
  const data = await findAll();
  res.json(data);
});
