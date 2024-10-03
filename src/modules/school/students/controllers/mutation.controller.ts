import { SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import Student from '../student.model';
import { studentService } from '../student.service';

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

/*<!-- 3. Patch ----------------------------( patchStudent )>*/
export const updateStudent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const student = await Student.findByIdAndUpdate(id, req.body, {
		new: true
	}).lean();
	new SuccessResponse('Student updated successfully', student).send(res);
});

/*<!-- 4. Patch ----------------------------( changeStudentFee )>*/
export const changeStudentFee = asyncHandler(async (req, res) => {
	const { studentId, amount, remarks } = req.body;

	const student = await studentService.updateStudentFee(
		studentId,
		amount,
		remarks
	);

	new SuccessResponse('Student fees updated successfully', student).send(res);
});

/*<!-- 5. Patch ----------------------------( changeStudentSection )>*/
export const changeStudentSection = asyncHandler(async (req, res) => {
	const { id, section } = req.body;
	const student = await Student.findByIdAndUpdate(
		id,
		{ section },
		{ new: true }
	).lean();
	new SuccessResponse('Student updated successfully', student).send(res);
});

/*<!-- 6. Patch ----------------------------( deactivateStudent )>*/
export const deactivateStudent = asyncHandler(async (req, res) => {
	const { id } = req.body;
	const student = await studentService.deactivateStudent(id);

	new SuccessResponse('Student updated successfully', student).send(res);
});

/*<!-- 7. Patch ----------------------------( activateStudent )>*/
export const activateStudent = asyncHandler(async (req, res) => {
	const { id } = req.body;
	const student = await studentService.reactivateStudent(id);
	new SuccessResponse('Student updated successfully', student).send(res);
});
