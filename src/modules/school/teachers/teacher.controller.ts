import asyncHandler from '@/lib/handlers/asyncHandler';
import TeacherModel from './teacher.model';
import { NotFoundError, SuccessMsgResponse, SuccessResponse } from '@/lib/api';
import { transformTeacherData } from './teacher.utils';

/*------------------  Create  +2 ----------------------------------- */
export const createTeacher = asyncHandler(async (req, res) => {
  // Transforming incoming data to match the schema structure
  const {
    first_name,
    last_name,
    gender,
    father_name,
    address,
    cnic,
    phone,
    dob,
    qualification,
    completion,
    score,
    institution,
    designation,
    appointment,
    appointed_by,
    salary,
  } = req.body;

  const transformedData = {
    first_name,
    last_name,
    gender,
    father_name,
    address,
    cnic,
    phone,
    dob: new Date(dob),
    qualification: {
      degree: qualification,
      year: completion,
      institution,
      marks: score,
    },
    appointment: {
      designation,
      date: new Date(appointment),
      appointed_by,
      salary,
    },
  };

  const newTeacher = new TeacherModel(transformedData);
  const savedTeacher = await newTeacher.save();
  new SuccessResponse(
    'Teacher created successfully',
    savedTeacher.toObject(),
  ).send(res);
});

export const insertManyTeachers = asyncHandler(async (req, res) => {
  const transformedTeachers = req.body.map(transformTeacherData);
  const insertedTeachers = await TeacherModel.insertMany(transformedTeachers);
  new SuccessResponse(
    `${insertedTeachers.length} Teachers inserted successfully`,
    insertedTeachers,
  ).send(res);
});
/*------------------ Read  +3  ----------------------------------- */
export const getTeacherById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacher = await TeacherModel.findById(id).lean();
  if (!teacher) {
    throw new NotFoundError('Teacher not found');
  }
  new SuccessResponse('Teacher fetched successfully', teacher).send(res);
});

export const getTeachersSorted = asyncHandler(async (req, res) => {
  const teachers = await TeacherModel.find({}).sort({ lastName: 1 }).lean(); // Sort by lastName ascending
  new SuccessResponse(
    'Teachers fetched and sorted successfully',
    teachers,
  ).send(res);
});

export const getTeacherByCnic = asyncHandler(async (req, res) => {
  const { cnic } = req.params;
  const teacher = await TeacherModel.findOne({ cnic }).lean(); // Use lean() for performance if you only need the JSON object
  if (!teacher) {
    throw new NotFoundError('Teacher not found');
  }
  new SuccessResponse('Teacher fetched successfully', teacher).send(res);
});

/*------------------  Update  +2  ----------------------------------- */
export const updateTeacherByCnic = asyncHandler(async (req, res) => {
  const { cnic } = req.params;
  const updateData = req.body;
  const updatedTeacher = await TeacherModel.findOneAndUpdate(
    { cnic },
    updateData,
    { new: true },
  ).lean();
  if (!updatedTeacher) {
    throw new NotFoundError('Teacher not found');
  }
  new SuccessResponse('Teacher updated successfully', updatedTeacher).send(res);
});

export const updateTeacherById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const updatedTeacher = await TeacherModel.findByIdAndUpdate(id, updateData, {
    new: true,
  }).lean();
  if (!updatedTeacher) {
    throw new NotFoundError('Teacher not found');
  }
  new SuccessResponse('Teacher updated successfully', updatedTeacher).send(res);
});

/*------------------  Delete +2  ----------------------------------- */
export const resetTeachers = asyncHandler(async (req, res) => {
  await TeacherModel.deleteMany({});
  new SuccessMsgResponse('All teachers have been deleted successfully').send(
    res,
  );
});

export const deleteTeacherById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedTeacher = await TeacherModel.findByIdAndDelete(id);
  if (!deletedTeacher) {
    throw new NotFoundError('Teacher not found');
  }
  new SuccessResponse('Teacher deleted successfully', deletedTeacher).send(res);
});
