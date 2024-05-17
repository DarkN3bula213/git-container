import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import type { User } from '@/modules/auth/users/user.model';
import { ClassModel } from '../../classes/class.model';
import StudentModel from '../../students/student.model';
import Payments from '..//payment.model';
import paymentQueue from '../payment.queue';
import paymentService from '../payment.service';
import { getPayId } from '../payment.utils';

/*<!-- 1. Create  ---------------------------( createPayment )-> */

export const createPayment = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const user = req.user as User;
  if (!user) throw new BadRequestError('User not found');
  const student = await StudentModel.findById(studentId);
  if (!student) throw new BadRequestError('Student not found');
  const grade = await ClassModel.findById(student.classId);
  if (!grade) throw new BadRequestError('Grade not found');
  const payId = getPayId(); // Month and year based ID

  // check for existing entries
  const existingPayment = await Payments.findOne({ payId, studentId });
  if (existingPayment) {
    throw new BadRequestError(
      'Payment already exists for this student and month',
    );
  }

  const records = new Payments({
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
  const user = req.user;
  const { studentIds } = req.body;
  if (!user) throw new BadRequestError('User not found');
  const paymentData = paymentService.createManyPayments(user, studentIds);
  return new SuccessResponse('Payments created successfully', paymentData).send(
    res,
  );
});
/*<!-- 2. Create  ---------------------------( Create Custom Payments )-> */
export const makeCustomPayment = asyncHandler(async (req, res) => {
  const { studentId, payId, paymentType } = req.body;

  const user = req.user;

  if (!user) throw new BadRequestError('User not found');

  const paymentData = paymentService.createCustomPayment(
    studentId,
    payId,
    paymentType,
    user,
  );
  return new SuccessResponse('Payment created successfully', paymentData).send(
    res,
  );
});

export const enqueuePaymentCreation = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const user = req.user as User;
  if (!user) throw new BadRequestError('User not found');

  try {
    await paymentQueue.add({
      studentId,
      userId: user._id,
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
      userId: user._id,
    });
  }

  res.status(202).send('Payment processing for multiple students initiated');
});
