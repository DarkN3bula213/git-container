import asyncHandler from '@/lib/handlers/asyncHandler';
import { ClassModel, IClass, IClassSubject } from './class.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { cache } from '@/data/cache/cache.service';
import { generateSubjectId } from './class.utils';

/*<!----------------------------------------(GET ROUTES) */
export const findClasses = asyncHandler(async (_req, res) => {
  const key = 'classes';
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

//
// ───────────────────────────────────────────────────────────────────────────
//

export const addSubjectToClass = asyncHandler(async (req, res) => {
  const { subject } = req.body;
  const { classId } = req.params;

  // Find the class by ID
  const existingClass = (await ClassModel.findById(classId)) as IClass;
  if (!existingClass) {
    throw new BadRequestError('Class not found');
  }

  // Check if the subject already exists in this class
  if (
    existingClass.subjects?.some(
      (sub: { name: string; level: string }) =>
        sub.name === subject && sub.level === existingClass.className,
    )
  ) {
    throw new BadRequestError('Subject already exists in this class');
  }

  const subjectId = generateSubjectId(subject, existingClass.className);
  console.log('Generated subjectId:', subjectId);

  // Create a new subject
  const newSubject = {
    classId: existingClass._id,
    subjectId: subjectId,
    name: subject,
    level: existingClass.className,
  } as IClassSubject;
  console.log(newSubject);
  // Add the new subject to the class
  existingClass.subjects?.push(newSubject);

  // Save the updated class
  const updatedClass = await existingClass.save();

  // Send success response
  new SuccessResponse('Subject added successfully', updatedClass).send(res);
});
