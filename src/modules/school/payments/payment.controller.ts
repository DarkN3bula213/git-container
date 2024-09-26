import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import type { User } from '@/modules/auth/users/user.model';
import { Types } from 'mongoose';
import { ClassModel } from '../classes/class.model';
import type { Student } from '../students/student.interface';
import StudentModel from '../students/student.model';
import {
	checkPaymentStatus,
	getStudentHistory,
	schoolAggregation,
	schoolAggregationBySession
} from './payment.aggregation';
import Payments, { type IPayment } from './payment.model';
import paymentQueue from './payment.queue';
import { addJobsToQueue, formatBillingCycle, getPayId } from './payment.utils';
import paymentsService from './payments.service';

// const logger = new Logger(__filename);

/*<!-- 1. Create  ---------------------------( createPayment )-> */
export const createPayment = asyncHandler(async (req, res) => {
	const { studentId } = req.body;
	const user = req.user as User;
	const userId = user._id as string;
	const data = (await paymentsService.createPayment(
		studentId,
		userId
	)) as IPayment;

	return new SuccessResponse('Payment created successfully', data).send(res);
});

/*<!-- 2. Create  ---------------------------( Multiple Payments )-> */
export const createPaymentsBulk = asyncHandler(async (req, res) => {
	const { studentIds } = req.body;

	const user = req.user as User;

	if (!user) throw new BadRequestError('User not found');
	const students = await StudentModel.find({ _id: { $in: studentIds } });
	if (students.length !== studentIds.length)
		throw new BadRequestError('One or more students not found');

	const classIds = students.map((student) => student.classId);
	const classes = await ClassModel.find({ _id: { $in: classIds } });

	const classInfoMap = new Map(
		classes.map((cls) => [cls._id.toString(), cls])
	);

	const records = students.map((student) => {
		const grade = classInfoMap.get(student.classId.toString());
		if (!grade) throw new BadRequestError('Grade not found for a student');

		return {
			studentId: student._id,
			studentName: student.name,
			classId: student.classId,
			className: grade.className,
			section: student.section,
			amount: grade.fee,
			paymentDate: new Date(),
			createdBy: user._id,
			paymentType: student.feeType,
			payId: getPayId()
		};
	});

	const insertedPayments = (await Payments.insertMany(records)) as object;
	return new SuccessResponse(
		'Payments created successfully',
		insertedPayments
	).send(res);
}); /*<!-- 2. Create  ---------------------------( Create Custom Payments )-> */
export const makeCustomPayment = asyncHandler(async (req, res) => {
	const { studentId, payId, paymentType } = req.body;

	const user = req.user as User;
	if (!user) throw new BadRequestError('User not found');

	const payment = await paymentsService.createOffBillCyclePayment(
		studentId,
		payId,
		paymentType,
		user._id
	);
	return new SuccessResponse('Payment created successfully', payment).send(
		res
	);
});

/*<!-- 1. Read  ---------------------------( Get All )-> */
export const getPayments = asyncHandler(async (_req, res) => {
	const key = getDynamicKey(DynamicKey.FEE, 'all');
	const cachedPayments = await cache.getWithFallback(key, async () => {
		return await Payments.find({}).lean().exec();
	});
	return new SuccessResponse(
		'Payments fetched successfully',
		cachedPayments
	).send(res);
});

/*<!-- 2. Read  ---------------------------( Get By ID )-> */
export const getPaymentById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const key = getDynamicKey(DynamicKey.FEE, id);

	const cachedPayment = await cache.getWithFallback(key, async () => {
		return await Payments.findById(id).lean().exec();
	});

	if (!cachedPayment) throw new BadRequestError('Payment not found');
	return new SuccessResponse(
		'Payment fetched successfully',
		cachedPayment
	).send(res);
});

/*<!-- 3. Read  ---------------------------( Get Student Payments )-> */
export const getPaymentsByStudentId = asyncHandler(async (req, res) => {
	const { studentId } = req.params;
	const cachedPayments = await Payments.find({
		studentId
	});

	if (!cachedPayments) throw new BadRequestError('Payments not found');
	return new SuccessResponse(
		'Payments fetched successfully',
		cachedPayments
	).send(res);
});
/*<!-- 5. Read  ---------------------------( Get Months Payments )-> */
export const getMonthsPayments = asyncHandler(async (req, res) => {
	const { payId } = req.params;
	const key = getDynamicKey(DynamicKey.FEE, payId);
	const cachedPayment = await cache.getWithFallback(key, async () => {
		return await Payments.find({ payId }).lean().exec();
	});
	if (!cachedPayment) throw new BadRequestError('Payment not found');
	return new SuccessResponse(
		'Payment fetched successfully',
		cachedPayment
	).send(res);
});

/*<!-- 6. Read  ---------------------------( Get Available Cycles )->*/

export const getAvailableBillingCycles = asyncHandler(async (_req, res) => {
	const payIDs = (await Payments.distinct('payId').exec()) as string[];

	if (!payIDs || payIDs.length === 0) {
		return res.status(404).json({ message: 'No billing cycles found.' });
	}

	// Format payIDs into a list of { label, value }
	const availableBillingCycles = formatBillingCycle(payIDs);

	return new SuccessResponse(
		'Available billing cycles fetched successfully',
		availableBillingCycles
	).send(res);
});

/*<!-- 6. Read  ---------------------------( Get Available Cycles )->*/
export const getFeesByCycle = asyncHandler(async (req, res) => {
	const { billingCycle } = req.params;
	const payID = billingCycle;

	if (!payID || payID.length !== 4) {
		return res.status(400).json({
			message: 'Invalid payID format. Expected MMYY.'
		});
	}

	const key = getDynamicKey(DynamicKey.FEE, `billing-cycle-${payID}`);
	const cachedPayments: any = await cache.getWithFallback(key, async () => {
		return await Payments.find({ payId: payID }).lean().exec();
	});

	if (cachedPayments.length === 0) {
		return res.status(404).json({
			message: 'No payments found for the specified billing cycle'
		});
	}

	// Fetch and append student names to the payments
	const paymentsWithStudentNames = await Promise.all(
		cachedPayments.map(async (payment: any) => {
			const student = await StudentModel.findById(payment.studentId)
				.lean()
				.exec();
			return {
				...payment,
				studentName: student ? student.name : 'Unknown Student'
			};
		})
	);

	return new SuccessResponse(
		`Payments for billing cycle ${payID} fetched successfully`,
		paymentsWithStudentNames
	).send(res);
});
/*<!-- 1. Update  ---------------------------( Update by ID )-> */
export const updatePayment = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { studentId, classId, amount, paymentDate } = req.body;
	const payment = await Payments.findByIdAndUpdate(
		id,
		{
			studentId,
			classId,
			amount,
			paymentDate
		},
		{ new: true }
	);
	if (!payment) throw new BadRequestError('Payment not found');
	return new SuccessResponse('Payment updated successfully', payment).send(
		res
	);
});

/*<!-- 1. Delete  ---------------------------( Delete by ID )-> */

export const deletePayment = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const response = await Payments.findByIdAndDelete(id);
	if (!response) throw new BadRequestError('Payment not found');
	return new SuccessResponse('Payment deleted successfully', response).send(
		res
	);
});
/*<!-- 2. Delete  ---------------------------( Reset )-> */
export const resetCollection = asyncHandler(async (_req, res) => {
	const payment = await Payments.deleteMany({});
	res.status(200).json({
		success: true,
		data: payment
	});
});

/*<!-- 3. Delete  ---------------------------( DeleteMany by ID )-> */

export const deleteManyByID = asyncHandler(async (req, res) => {
	const { ids } = req.body;
	const response = await Payments.deleteMany({ _id: { $in: ids } });
	if (!response) throw new BadRequestError('Payments not found');
	return new SuccessResponse('Payments deleted successfully', response).send(
		res
	);
});

/****
 *
 *  Queues
 *
 *
 ****/

export const enqueuePaymentCreation = asyncHandler(async (req, res) => {
	const { studentId } = req.body;
	const user = req.user as User;

	try {
		await paymentQueue.add({
			studentId: studentId,
			userId: user._id
		});

		res.status(202).send('Payment processing initiated');
	} catch (error) {
		res.status(500).send(`Error: ${error}`);
	}
});

export const enqueueMultiplePayments = asyncHandler(async (req, res) => {
	const { studentIds } = req.body;
	const user = req.user as User;

	for (const studentId of studentIds) {
		paymentQueue.add({
			studentId,
			userId: user._id
		});
	}

	res.status(202).send('Payment processing for multiple students initiated');
});

/** -----------------------------( Batch Payments ) */

export const handleBatchPayments = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const { studentIds } = req.body;
	addJobsToQueue(studentIds, user._id, 'paymentQueue');

	res.status(202).send('Payment processing for multiple students initiated');
});

/*<!-- 1. Aggregation Functions  ----------------( Get Students With Payments ) */
export const getStudentPaymentsByClass = asyncHandler(async (req, res) => {
	const { className } = req.params;
	const payId = getPayId();

	const students: Student[] = await checkPaymentStatus(className, payId);

	return new SuccessResponse('Student payments', students).send(res);
});

/*<!-- 2. Aggregation Functions  ----------------( School Stats ) */
export const getSchoolStats = asyncHandler(async (_req, res) => {
	const key = getDynamicKey(DynamicKey.FEE, 'STATCURRENT');
	const cachedStats = await cache.getWithFallback(key, async () => {
		return await schoolAggregation();
	});
	if (!cachedStats) throw new BadRequestError('Stats not found');
	return new SuccessResponse('Stats fetched successfully', cachedStats).send(
		res
	);
});

/*<!-- 3. Aggregation Functions  ----------------( School Stats By Session ) */
export const getSchoolStatsBySession = asyncHandler(async (req, res) => {
	const { payId } = req.params;
	const key = getDynamicKey(DynamicKey.FEE, payId);
	const cachedStats = await cache.getWithFallback(key, async () => {
		return await schoolAggregationBySession(payId);
	});
	if (!cachedStats) throw new BadRequestError('Stats not found');
	return new SuccessResponse('Stats fetched successfully', cachedStats).send(
		res
	);
});

/*<!-- 4. Aggregations  ---------------------( Get Student History )-> */

export const getStudentPaymentHistory = asyncHandler(async (req, res) => {
	const { studentId } = req.params;
	const id = new Types.ObjectId(studentId);
	const history = await getStudentHistory(id);
	return new SuccessResponse('Student payment history', history).send(res);
});

export const customSorting = asyncHandler(async (_req, res) => {
	// const key = getDynamicKey(DynamicKey.STUDENTS, 'sorted');
	// Custom sorting order for class names
	const classOrder: { [key: string]: number } = {
		Nursery: 1,
		Prep: 2,
		'1st': 3,
		'2nd': 4,
		'3rd': 5,
		'4th': 6,
		'5th': 7,
		'6th': 8,
		'7th': 9,
		'8th': 10,
		'9th': 11,
		'10th': 12
	};
	const students = await StudentModel.find({});

	students.sort((a, b) => {
		const classDiff = classOrder[a.className] - classOrder[b.className];
		if (classDiff !== 0) return classDiff;
		return a.section.localeCompare(b.section);
	});
	new SuccessResponse('Students fetched successfully', students).send(res);
});

export const commitTransaction = asyncHandler(async (req, res) => {
	const { studentIds } = req.body;
	const user = req.user as User;
	if (!user) throw new BadRequestError('User not found');
	const response = (await paymentsService.commitMultiInsert(
		studentIds,
		user._id as string
	)) as IPayment[];
	return new SuccessResponse('Payments created successfully', response).send(
		res
	);
});

export const deleteCommittedPayment = asyncHandler(async (req, res) => {
	const { paymentId } = req.params;
	const response = await paymentsService.deletePayment(paymentId);
	return new SuccessResponse('Payment deleted successfully', response).send(
		res
	);
});
export const deleteCommittedTransactions = asyncHandler(async (req, res) => {
	const { studentIds } = req.body;
	const response = await paymentsService.deleteMultiplePayments(studentIds);
	return new SuccessResponse('Payments deleted successfully', response).send(
		res
	);
});
