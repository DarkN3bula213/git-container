import asyncHandler from '@/lib/handlers/asyncHandler';

import Student from './student.model';
import { SuccessMsgResponse, SuccessResponse } from '@/lib/api';
import { updateStudentClassIds } from './student.utils';
import { studentService } from './student.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { cache } from '@/data/cache/cache.service';

/*<!-- 1. Get ----------------------------( getStudents )*/

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

/*<!-- 2. Get ----------------------------( getStudentByClass )>*/

export const getStudentByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const key = getDynamicKey(DynamicKey.CLASS, classId);

  const students = await cache.get(key, async () => {
    return await Student.find({
      className: classId,
    })
      .select('+name +classId +className +admission_date')
      .lean()
      .exec();
  });

  new SuccessResponse('Students fetched successfully', students).send(res);
});

/*<!-- 3. Get ----------------------------( getStudentsById )>*/

export const getStudentsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const students = await Student.findById(id).lean().exec();

  new SuccessResponse('Students fetched successfully', students).send(res);
});

/*<!-- 4. Get ----------------------------( sortedByClassName )>*/

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

/*<!-- 1. Post ----------------------------( createStudent )>*/

export const createStudent = asyncHandler(async (req, res) => {
  const newStudent = new Student(req.body);
  const student = newStudent.toObject();
  new SuccessResponse('Student created successfully', student).send(res);
});

/*<!-- 2. Post ----------------------------( newAdmission )>*/
export const newAdmission = asyncHandler(async (req, res) => {
  const data = req.body;
  const register = await studentService.resgisterStudent(data);
  const student = await register.toObject();
  new SuccessResponse('Student created successfully', student).send(res);
});

/*<!-- 3. Post ----------------------------( bulkPost )>*/

export const bulkPost = asyncHandler(async (req, res) => {
  console.time('getStudents');
  const savedStudent = await Student.insertMany(req.body);

  new SuccessResponse('Students created successfully', savedStudent).send(res);
  console.timeEnd('getStudents');
});

/*------------------     ----------------------------------- */

/*------------------     ----------------------------------- */

/*<!-- 1. Patch ----------------------------( patchStudent )>*/

export const patchStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await Student.findByIdAndUpdate(id, req.body, {
    new: true,
  }).lean();
  new SuccessResponse('Student updated successfully', student).send(res);
});

/*<!-- 2. Patch ----------------------------( fixStudentClassIds )>*/

export const fixStudentClassIds = asyncHandler(async (req, res) => {
  updateStudentClassIds();
  new SuccessMsgResponse('Fixing student classIds').send(res);
});

/*------------------     ----------------------------------- */
/*------------------     ----------------------------------- */

/*<!-- 1. Delete ----------------------------( removeStudent )>*/

export const removeStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await Student.findByIdAndDelete(id).lean();
  new SuccessResponse('Student deleted successfully', student).send(res);
});

/*<!-- 2. Delete ----------------------------( removeStudent )>*/

export const resetCollection = asyncHandler(async (req, res) => {
  await Student.deleteMany();
  new SuccessMsgResponse('Collection reset successfully').send(res);
});
