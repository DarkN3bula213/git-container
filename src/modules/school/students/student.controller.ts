import asyncHandler from "@/lib/handlers/asyncHandler";

import Student from "./student.model";
import { SuccessMsgResponse, SuccessResponse } from "@/lib/api";
import { updateStudentClassIds } from "./student.utils";


/*------------------     ----------------------------------- */

export const createStudent = asyncHandler(async (req, res) => {
  const newStudent = new Student(req.body);
  const student = await newStudent.save();
  new SuccessResponse('Student created successfully', student).send(res);
});

/*------------------     ----------------------------------- */


export const getStudents = asyncHandler(async (req, res) => {
  const students = await Student.find()
    .select('+name +classId +className +admission_date')
    .lean()
    .exec();
  // new SuccessResponse('Students fetched successfully', students).send(res);
  res.status(200).json({
    status: 'success',
    data: students,
  });
});

/*------------------     ----------------------------------- */
export const getStudentsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const students = await Student.findById(id).lean().exec();

  new SuccessResponse('Students fetched successfully', students).send(res);
});

/*------------------     ----------------------------------- */

/*------------------     ----------------------------------- */
export const sortedByClassName = asyncHandler(async (req, res) => {
  const queryPage = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.limit as string) || 10;

  const students = await Student.find()
    .sort({ className: -1 })
    .skip((queryPage - 1) * pageSize)
    .limit(pageSize)
    .lean()
    .exec();
  const total = await Student.countDocuments();

  new SuccessResponse('Students fetched successfully', {
    students,
    total,
    page: queryPage,
    limit: pageSize,
  }).send(res);
});
/*------------------     ----------------------------------- */


export const bulkPost = asyncHandler(async (req, res) => {
  console.time('getStudents');
  const savedStudent = await Student.insertMany(req.body);

  new SuccessResponse('Students created successfully', savedStudent).send(res);
  console.timeEnd('getStudents');
});

export const fixStudentClassIds = asyncHandler(async (req, res) => {
  updateStudentClassIds();
  new SuccessMsgResponse('Fixing student classIds').send(res);
});

/*------------------     ----------------------------------- */

export const resetCollection = asyncHandler(async (req, res) => {
  await Student.deleteMany();
  new SuccessMsgResponse('Collection reset successfully').send(res);
})