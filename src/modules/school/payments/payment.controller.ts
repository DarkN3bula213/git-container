import asyncHandler from '@/lib/handlers/asyncHandler';

import Payments, { IPayment } from './payment.model';
import StudentModel from '../students/student.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { User } from '@/modules/auth/users/user.model';
import { addJobsToQueue, getPayId } from './payment.utils';
import { ClassModel } from '../classes/class.model';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { cache } from '@/data/cache/cache.service';
import { Student } from '../students/student.interface';
import {
  checkPaymentStatus,
  getStudentHistory,
  schoolAggregation,
  schoolAggregationBySession,
} from './payment.aggregation';
import paymentQueue from './payment.queue';
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);

/*<!-- 1. Create  ---------------------------( createPayment )-> */

export const createPayment = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const user = req.user as User;
  if (!user) throw new BadRequestError('User not found');
  const student = await StudentModel.findById(studentId);
  if (!student) throw new BadRequestError('Student not found');
  const grade = await ClassModel.findById(student.classId);
  if (!grade) throw new BadRequestError('Grade not found');

  const records: IPayment = new Payments({
    studentId: student._id,
    classId: student.classId,
    className: grade.className,
    section: student.section,
    amount: grade.fee,
    paymentDate: new Date(),
    createdBy: user._id,
    paymentType: student.feeType,
    payId: getPayId(),
  });

  await records.save();
  return new SuccessResponse('Payment created successfully', records).send(res);
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

  const classInfoMap = new Map(classes.map((cls) => [cls._id.toString(), cls]));

  const records = students.map((student) => {
    const grade = classInfoMap.get(student.classId.toString());
    if (!grade) throw new BadRequestError('Grade not found for a student');

    return {
      studentId: student._id,
      classId: student.classId,
      className: grade.className,
      section: student.section,
      amount: grade.fee,
      paymentDate: new Date(),
      createdBy: user._id,
      paymentType: student.feeType,
      payId: getPayId(),
    };
  });

  const insertedPayments = await Payments.insertMany(records);
  return new SuccessResponse(
    'Payments created successfully',
    insertedPayments,
  ).send(res);
});
/*<!-- 2. Create  ---------------------------( Create Custom Payments )-> */
export const makeCustomPayment = asyncHandler(async (req, res) => {
  const { studentId, payId, paymentType } = req.body;

  const user = req.user as User;
  if (!user) throw new BadRequestError('User not found');
  const student = await StudentModel.findById(studentId);
  if (!student) throw new BadRequestError('Student not found');
  const grade = await ClassModel.findById(student.classId);
  if (!grade) throw new BadRequestError('Grade not found');

  const records: IPayment = new Payments({
    studentId: student._id,
    classId: student.classId,
    className: grade.className,
    section: student.section,
    amount: student.tuition_fee,
    paymentDate: Date.now(),
    createdBy: user._id,
    paymentType: paymentType,
    payId: payId,
  });

  await records.save();
  return new SuccessResponse('Payment created successfully', records).send(res);
});

/*<!-- 1. Read  ---------------------------( Get All )-> */
export const getPayments = asyncHandler(async (req, res) => {
  const key = getDynamicKey(DynamicKey.FEE, 'all');
  const cachedPayments = await cache.get(key, async () => {
    return await Payments.find({}).lean().exec();
  });
  return new SuccessResponse(
    'Payments fetched successfully',
    cachedPayments,
  ).send(res);
});

/*<!-- 2. Read  ---------------------------( Get By ID )-> */
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const key = getDynamicKey(DynamicKey.FEE, id);

  const cachedPayment = await cache.get(key, async () => {
    return await Payments.findById(id).lean().exec();
  });

  if (!cachedPayment) throw new BadRequestError('Payment not found');
  return new SuccessResponse(
    'Payment fetched successfully',
    cachedPayment,
  ).send(res);
});

/*<!-- 3. Read  ---------------------------( Get Student Payments )-> */
export const getPaymentsByStudentId = asyncHandler(async (req, res) => {
  const key = getDynamicKey(DynamicKey.FEE, req.params.studentId);

  const cachedPayments = await cache.get(key, async () => {
    return await Payments.find({ studentId: req.params.studentId })
      .lean()
      .exec();
  });
  if (!cachedPayments) throw new BadRequestError('Payments not found');
  return new SuccessResponse(
    'Payments fetched successfully',
    cachedPayments,
  ).send(res);
});

/*<!-- 5. Read  ---------------------------( Get Months Payments )-> */
export const getMonthsPayments = asyncHandler(async (req, res) => {
  const payId = getPayId();
  const key = getDynamicKey(DynamicKey.FEE, payId);
  const cachedPayment = await cache.get(key, async () => {
    return await Payments.findOne({ payId }).lean().exec();
  });
  if (!cachedPayment) throw new BadRequestError('Payment not found');
  return new SuccessResponse(
    'Payment fetched successfully',
    cachedPayment,
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
      paymentDate,
    },
    { new: true },
  );
  if (!payment) throw new BadRequestError('Payment not found');
  return new SuccessResponse('Payment updated successfully', payment).send(res);
});

/*<!-- 1. Delete  ---------------------------( Delete by ID )-> */

export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const response = await Payments.findByIdAndDelete(id);
  if (!response) throw new BadRequestError('Payment not found');
  return new SuccessResponse('Payment deleted successfully', response).send(
    res,
  );
});
/*<!-- 2. Delete  ---------------------------( Reset )-> */
export const resetCollection = asyncHandler(async (req, res) => {
  const payment = await Payments.deleteMany({});
  res.status(200).json({
    success: true,
    data: payment,
  });
});

/*<!-- 3. Delete  ---------------------------( DeleteMany by ID )-> */

export const deleteManyByID = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const response = await Payments.deleteMany({ _id: { $in: ids } });
  if (!response) throw new BadRequestError('Payments not found');
  return new SuccessResponse('Payments deleted successfully', response).send(
    res,
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
      userId: user._id,
    });

    res.status(202).send('Payment processing initiated');
  } catch (error) {
    res.status(500).send('Failed to enqueue payment');
  }
});

export const enqueueMultiplePayments = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;
  const user = req.user as User;

  studentIds.forEach((studentId: string) => {
    paymentQueue.add({
      studentId,
      userId: user._id,
    });
  });

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
export const getSchoolStats = asyncHandler(async (req, res) => {
  const key = getDynamicKey(DynamicKey.FEE, 'STATCURRENT');
  const cachedStats = await cache.get(key, async () => {
    return await schoolAggregation();
  });
  if (!cachedStats) throw new BadRequestError('Stats not found');
  return new SuccessResponse('Stats fetched successfully', cachedStats).send(
    res,
  );
});

/*<!-- 3. Aggregation Functions  ----------------( School Stats By Session ) */
export const getSchoolStatsBySession = asyncHandler(async (req, res) => {
  const { payId } = req.params;
  const key = getDynamicKey(DynamicKey.FEE, payId);
  const cachedStats = await cache.get(key, async () => {
    return await schoolAggregationBySession(payId);
  });
  if (!cachedStats) throw new BadRequestError('Stats not found');
  return new SuccessResponse('Stats fetched successfully', cachedStats).send(
    res,
  );
});

/*<!-- 4. Aggregations  ---------------------( Get Student History )-> */

export const getStudentPaymentHistory = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const history = await getStudentHistory(studentId);
  return new SuccessResponse('Student payment history', history).send(res);
});
