import asyncHandler from '@/lib/handlers/asyncHandler';

import payments from './payment.model';
import StudentModel from '../students/student.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { User } from '@/modules/auth/users/user.model';
import { getPayId } from './payment.utils';


/*---1. CREATE PAYMENT ------------------------------------------------------------------- */

export const createPayment = asyncHandler(async (req, res) => {
  const { studentId, amount } = req.body;

  const user = req.user as User;
  if (!user) throw new BadRequestError('User not found');

  const student = await StudentModel.findById(studentId);
  if (!student) throw new BadRequestError('Student not found');

  if (student.tuition_fee < amount)
    throw new BadRequestError('Amount exceeds tuition fee');
  const payId = getPayId();
  const payment = new payments({
    studentId: student._id,
    classId: student.classId,
    className: student.className,
    section: student.section,
    amount: amount,
    paymentDate: new Date(),
    createdBy: user._id,
    paymentType: student.feeType,
    payId: payId,
  });
  const savePayment = await payment.save();

  return new SuccessResponse('Payment created successfully', savePayment).send(
    res,
  );
});


/*---2. GET ALL PAYMENTS----------------------------------------------------------------- */
export const getPayments = asyncHandler(async (req, res) => {
  await payments.find({}, (err: { message: any }, data: any) => {
    if (err) {
      res.status(500).send({
        message:
          err.message || 'Some error occurred while retrieving payments.',
      });
    } else {
      res.status(200).send(data);
    }
  });
});


/*-3. GET PAYMENT BY ID----------------------------------------------------------------- */
export const getPaymentById = asyncHandler(async (req, res) => {
  await payments.findById(req.params.id, (err: { message: any }, data: any) => {
    if (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving payment.',
      });
    } else {
      res.status(200).send(data);
    }
  });
});


/*-4. UPDATE PAYMENT BY ID----------------------------------------------------------------- */
export const updatePayment = asyncHandler(async (req, res) => {
const { studentId, amount } = req.body;
  await payments.findByIdAndUpdate(
    req.params.id,
    {
      studentId: studentId,
      amount: amount,
    },
    (err: { message: any }, data: any) => {
      if (err) {
        res.status(500).send({
          message: err.message || 'Some error occurred while updating payment.',
        });
      } else {
        res.status(200).send(data);
      }
    },
  );
});

export const deletePayment = asyncHandler(async (req, res) => {
  await payments.findByIdAndDelete(
    req.params.id,
    (err: { message: any }, data: any) => {
      if (err) {
        res.status(500).send({
          message: err.message || 'Some error occurred while deleting payment.',
        });
      } else {
        res.status(200).send(data);
      }
    },
  );
});

/*-5. GET PAYMENT BY STUDENT ID----------------------------------------------------------------- */
export const getPaymentsByStudentId = asyncHandler(async (req, res) => {
  await payments.find(
    { studentId: req.params.studentId },
    (err: { message: any }, data: any) => {
      if (err) {
        res.status(500).send({
          message:
            err.message || 'Some error occurred while retrieving payments.',
        });
      } else {
        res.status(200).send(data);
      }
    },
  );
});

/*-6. GET PAYMENT BY CLASS ID----------------------------------------------------------------- */
export const getPaymentsByClassId = asyncHandler(async (req, res) => {
  await payments.find(
    { classId: req.params.classId },
    (err: { message: any }, data: any) => {
      if (err) {
        res.status(500).send({
          message:
            err.message || 'Some error occurred while retrieving payments.',
        });
      } else {
        res.status(200).send(data);
      }
    },
  );
});

/*-7. GET PAYMENT BY PAY ID----------------------------------------------------------------- */
export const getPaymentByPayId = asyncHandler(async (req, res) => {
  await payments.find(
    { payId: req.params.payId },
    (err: { message: any }, data: any) => {
      if (err) {
        res.status(500).send({
          message:
            err.message || 'Some error occurred while retrieving payments.',
        });
      } else {
        res.status(200).send(data);
      }
    },
  );
});


/*---8. DELETE PAYMENT BY ID---------------------------------------------------------------- */
export const deletPayment = asyncHandler(async (req, res) => {
  await payments.findByIdAndDelete(
    req.params.id,
    (err: { message: any }, data: any) => {
      if (err) {
        res.status(500).send({
          message: err.message || 'Some error occurred while deleting payment.',
        });
      } else {
        res.status(200).send(data);
      }
    },
  );
});



/*--9. RESET CO----------------------------------------------------------------- */
export const resetCollection = asyncHandler(async (req, res) => {
  const payment = await payments.deleteMany({});
  res.status(200).json({
    success: true,
    data: payment,
  });
})