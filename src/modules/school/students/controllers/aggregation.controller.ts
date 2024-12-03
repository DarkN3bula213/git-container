import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { classOrder } from '@/lib/constants/classOrder';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { sortStudentsByClassAndSection } from '@/lib/utils/utils';
import { getPayId } from '../../payments/payment.utils';
import { getStudentsWithPaymentHistory } from '../aggregations/24month.aggregation';
import {
	allStudentsWithPayments, // rootStudentAggregation,
	studentDetailsWithPayments,
	studentPaidAggregation
} from '../aggregations/student.aggregation';
import { Student } from '../student.interface';

/*<!-- 1. Aggregation ----------------------------( getStudents )*/
export const studentFeeAggregated = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const data = await studentDetailsWithPayments(id);
	if (!data) return new BadRequestError('No students found');
	new SuccessResponse('Students fetched successfully', data).send(res);
});

/*<!-- 2. Aggregation ----------------------------( Return with Paid Status )*/
export const fetchStudentsWithPaidStatus = asyncHandler(async (_req, res) => {
	const payId = getPayId();

	const students = await studentPaidAggregation(payId);

	new SuccessResponse('Students fetched successfully', students).send(res);
});

/*<!-- 3. Aggregation ----------------------------( getStudentsWithPayments )*/
export const getStudentsWithPayments = asyncHandler(async (_req, res) => {
	const payId = getPayId();
	const key = getDynamicKey(DynamicKey.STUDENTS, payId);
	const students = (await cache.getWithFallback(key, async () => {
		return await allStudentsWithPayments(payId, classOrder);
	})) as Student[];
	return new SuccessResponse(
		'Students with payment status fetched successfully',
		students
	).send(res);
});

export const monthlyAggregatedStudentsController = asyncHandler(
	async (_req, res) => {
		const key = getDynamicKey(DynamicKey.STUDENTS, 'monthly');

		const students = (await cache.getWithFallback(key, async () => {
			return await getStudentsWithPaymentHistory();
		})) as Student[];
		if (!students) return new BadRequestError('No students found');
		new SuccessResponse(
			'Students fetched successfully',
			sortStudentsByClassAndSection(students)
		).send(res);
	}
);
