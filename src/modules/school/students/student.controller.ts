import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { classOrder } from '@/lib/constants/classOrder';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { getPayId } from '../payments/payment.utils';
import {
	allStudentsWithPayments,
	rootStudentAggregation,
	studentDetailsWithPayments
} from './student.aggregation';
import Student from './student.model';
import { studentService } from './student.service';

/**                      *
 *  Aggregation Methods  *
 *                     **/
/*<!-- 1. Aggregation ----------------------------( getStudents )*/
export const studentFeeAggregated = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const data = await studentDetailsWithPayments(id);
	if (!data) return new BadRequestError('No students found');
	new SuccessResponse('Students fetched successfully', data).send(res);
});

/*<!-- 1. Get ----------------------------( getStudents )*/

export const getStudents = asyncHandler(async (_req, res) => {
	const students = await Student.find()
		.select('+name +classId +className +admission_date')
		.lean()
		.exec();
	// new SuccessResponse('Students fetched successfully', students).send(res);
	res.status(200).json({
		status: 'success',
		data: students
	});
});

/*<!-- 2. Get ----------------------------( getStudentByClass )>*/

export const getStudentByClass = asyncHandler(async (req, res) => {
	const { classId } = req.params;
	const key = getDynamicKey(DynamicKey.CLASS, classId);

	const students = await cache.getWithFallback(key, async () => {
		return await Student.find({
			className: classId
		})
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
	const queryPage = Number.parseInt(req.query.page as string) || 1;
	const pageSize = Number.parseInt(req.query.limit as string) || 10;

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
		limit: pageSize
	}).send(res);
});

/*<!-- 5. Get -----| Root |-----------------------( Custom Sorting )>*/
export const rootFetch = asyncHandler(async (_req, res) => {
	const key = getDynamicKey(DynamicKey.STUDENTS, 'sorted');

	const payId = getPayId();

	const students = await cache.getWithFallback(key, async () => {
		return await rootStudentAggregation(payId);
	});

	new SuccessResponse('Students fetched successfully', students).send(res);
});

/*<!-- 6. Get ----------------------------( getStudentsByClassId )>*/

export const getStudentsWithPayments = asyncHandler(async (_req, res) => {
	const payId = getPayId();

	const key = getDynamicKey(DynamicKey.STUDENTS, payId);

	const students = await cache.getWithFallback(key, async () => {
		return await allStudentsWithPayments(payId, classOrder);
	});
	// const studentsWithPayments = await allStudentsWithPayments(payId, classOrder);
	new SuccessResponse(
		'Students with payment status fetched successfully',
		students
	).send(res);
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

// export const bulkPost = asyncHandler(async (req, res) => {
//   console.time('getStudents');
//   const savedStudent = await Student.insertMany(req.body);

//   new SuccessResponse('Students created successfully', savedStudent).send(res);
//   console.timeEnd('getStudents');
// });

/*------------------     ----------------------------------- */

/*------------------     ----------------------------------- */

/*<!-- 1. Patch ----------------------------( patchStudent )>*/

export const patchStudent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const student = await Student.findByIdAndUpdate(id, req.body, {
		new: true
	}).lean();
	new SuccessResponse('Student updated successfully', student).send(res);
});

/*<!-- 2. Patch ----------------------------( fixStudentClassIds )>*/

// export const fixStudentClassIds = asyncHandler(async (_req, res) => {
//   updateStudentClassIds();
//   new SuccessMsgResponse('Fixing student classIds').send(res);
// });

/*<!-- 1. Delete ----------------------------( removeStudent )>*/

export const removeStudent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const student = await Student.findByIdAndUpdate(id, {
		$set: {
			status: {
				isActive: false,
				hasLeft: true
			}
		}
	}).lean();
	new SuccessResponse('Student deleted successfully', student).send(res);
});

/*<!-- 2. Delete ----------------------------( removeStudent )>*/

// export const resetCollection = asyncHandler(async (_req, res) => {
//   await Student.deleteMany();
//   new SuccessMsgResponse('Collection reset successfully').send(res);
// });

/*------------------     ----------------------------------- */
export const updateStudentFees = asyncHandler(async (req, res) => {
	const { studentId, amount, remarks } = req.body;

	const student = await studentService.updateStudentFee(
		studentId,
		amount,
		remarks
	);

	new SuccessResponse('Student fees updated successfully', student).send(res);
});
/*------------------     ----------------------------------- */
/*<!-- 3. Patch ----------------------------( change student section )>*/
export const changeStudentSection = asyncHandler(async (req, res) => {
	const { id, section } = req.body;
	const student = await Student.findByIdAndUpdate(
		id,
		{ section },
		{ new: true }
	).lean();
	new SuccessResponse('Student updated successfully', student).send(res);
});
