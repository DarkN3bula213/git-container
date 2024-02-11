import asyncHandler from '@/lib/handlers/asyncHandler';
import { ClassModel } from './class.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';
// import { getCachedClasses } from './class.cache';


export const findClasses = asyncHandler(async (req, res) => {
  const data = await ClassModel.find().lean().exec();
  // const data = getCachedClasses();
  new SuccessResponse('Classes', data).send(res);
});
export const addClass = asyncHandler(async (req, res) => {
  const classModel = new ClassModel(req.body);
  const data = await classModel.save();
  new SuccessResponse('Class added successfully', data).send(res);
});

export const insertMany = asyncHandler(async (req, res) => {
  const data = await ClassModel.insertMany(req.body);
  new SuccessResponse('Classes added successfully', data).send(res);
});
export const updateClass = asyncHandler(async (req, res) => {
  const data = await ClassModel.findByIdAndUpdate(req.params.id, req.body);
  new SuccessResponse('Class updated successfully', data).send(res);
});
export const deleteClass = asyncHandler(async (req, res) => {
  const data = await ClassModel.findByIdAndDelete(req.params.id);
  new SuccessResponse(' Class deleted successfully'  , data).send(res);
});
export const findClassById = asyncHandler(async (req, res) => {
  const data = await ClassModel.findById(req.params.id).lean().exec();
  new SuccessResponse(' Class', data).send(res);
});



export const deleteAll = asyncHandler(async (req, res) => {
  const data = await ClassModel.deleteMany();

  new SuccessResponse('All classes deleted', data).send(res);
})


export const findClassByName = asyncHandler(async (req, res) => {
  const data = await ClassModel.find({ className: req.params.name }).lean().exec();
  if(data.length == 0){
    throw new BadRequestError('Class not found');
  }
  new SuccessResponse(' Class', data).send(res);
})

export const updateClassFee = asyncHandler(async (req, res) => {
  const data = await ClassModel.find({ className: req.params.name })
    .lean()
    .exec();
  if(data.length == 0){
    throw new BadRequestError('Class not found');
  }
  const result = await ClassModel.findByIdAndUpdate( data[0]._id, req.body, { new: true });
  new SuccessResponse('Class updated successfully', result).send(res);
})