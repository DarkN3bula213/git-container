import { BadRequestError } from '@/lib/api';
import StudentModel from '../students/student.model';
import Payments from './payment.model';
import { generateSerial, getPayId } from './payment.utils';
import { Student } from '../students/student.interface';
import { InvoiceProps } from '@/types';
import { generateInvoiceToken } from '@/lib/utils/tokens';
import { generateQRCode } from '@/lib/utils/utils';
import { Logger } from '@/lib/logger';
import { ClientSession, startSession } from 'mongoose';
const logger = new Logger(__filename);

class PaymentService {
  async getNextInvoiceId(): Promise<string> {
    return await generateSerial();
  }

  async generateInvoice(paymentId: string, studentId: string) {
    const payment = await Payments.findById(paymentId);
    if (!payment) throw new BadRequestError('Payment not found');
    const student = (await StudentModel.findById(studentId)
      .select('address father_name description')
      .exec()) as Student;
    if (!student) throw new BadRequestError('Student not found');

    try {
      const tokenPayload: InvoiceProps = {
        studentId: student._id as string,
        studentName: student.name,
        amount: student.tuition_fee,
        class: student.className,
        section: student.section,
        issuedAt: new Date(),
        payId: payment.payId,
        paidOn: payment.paymentDate,
        address: student.address,
        invoiceId: payment.invoiceId,
        guardian: student.father_name,
        balance: 0,
        isAdvanced: false,
        isArrears: false,
      };

      const token = generateInvoiceToken(tokenPayload);
      const qrCode = await generateQRCode(token);

      return { token, qrCode };
    } catch (error: any) {
      logger.error(error);
      throw new BadRequestError('Error generating invoice');
    }
  }

  async createPayment(studentId: string, userId: string) {
    if (!studentId || !userId)
      throw new BadRequestError('Invalid student id or user id');

    const student = await StudentModel.findById(studentId);
    if (!student) throw new BadRequestError('Student not found');

    try {
      const payId = getPayId();
      const invoiceId = await this.getNextInvoiceId();

      const payment = {
        studentId: student._id,
        classId: student.classId,
        className: student.className,
        section: student.section,
        amount: student.tuition_fee,
        paymentDate: new Date(),
        createdBy: userId,
        paymentType: student.feeType,
        invoiceId: invoiceId,
        payId: payId,
      };
      return payment;
    } catch (err: any) {
      logger.error(err);
      throw new BadRequestError('Error creating payment');
    }
  }

  async commitMultiInsert(studentIds: string[], userId: string) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new BadRequestError('studentIds should be a non-empty array');
    }

    const session: ClientSession = await startSession();
    session.startTransaction();
    try {
      const payId = getPayId();
      const studentData: Student[] = [];

      for (const id of studentIds) {
        const student = (await StudentModel.findById(id).session(
          session,
        )) as Student;
        if (!student) throw new BadRequestError(`Student not found: ${id}`);
        studentData.push(student);
      }

      // Pre-generate invoice numbers for all payments
      const invoiceIds = [] as string[];
      for (let i = 0; i < studentData.length; i++) {
        invoiceIds.push(await this.getNextInvoiceId());
      }

      const payments = studentData.map((student, index) => ({
        studentId: student._id,
        classId: student.classId,
        className: student.className,
        section: student.section,
        amount: student.tuition_fee,
        paymentDate: new Date(),
        createdBy: userId,
        paymentType: student.feeType,
        invoiceId: invoiceIds[index],
        payId: payId,
      }));

      const paymentDocs = await Payments.insertMany(payments, { session });

      // Other database operations...
      // Push Entry into Student's Payment History
      await StudentModel.updateMany(
        { _id: { $in: studentIds } },
        {
          $push: {
            paymentHistory: {
              $each: paymentDocs.map((payment) => ({
                paymentId: payment._id,
                payId: payment.payId,
                amount: payment.amount,
                date: payment.paymentDate,
              })),
            },
          },
        },
        { session },
      );

      await session.commitTransaction();
      return paymentDocs;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deletePayment(paymentId: string) {
    const session: ClientSession = await startSession();
    session.startTransaction();
    try {
      // Find the payment document
      const payment = await Payments.findById(paymentId).session(session);
      if (!payment) {
        throw new BadRequestError('Payment not found');
      }

      // Delete the payment document
      await Payments.findByIdAndDelete(paymentId).session(session);

      // Remove the entry from the student's payment history
      await StudentModel.findByIdAndUpdate(
        payment.studentId,
        {
          $pull: {
            paymentHistory: {
              paymentId: paymentId,
            },
          },
        },
        { session },
      );

      await session.commitTransaction();
      return { message: 'Payment deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deleteMultiplePayments(studentIds: string[]) {
    const session: ClientSession = await startSession();
    session.startTransaction();
    const payId = getPayId();
    try {
      // Find the payment documents
      const payments = await Payments.find({
        studentId: { $in: studentIds },
        payId: payId,
      }).session(session);
      if (!payments) {
        logger.error('Payments not found');
        throw new BadRequestError('Payments not found');
      }

      // Delete the payment documents
      const paymentIds = payments.map((payment) => payment._id);
      await Payments.deleteMany({ _id: { $in: paymentIds } }).session(session);

      // Remove the entries from the student's payment history
      await StudentModel.updateMany(
        { _id: { $in: payments.map((payment) => payment.studentId) } },
        {
          $pull: {
            paymentHistory: {
              paymentId: { $in: paymentIds },
            },
          },
        },
        { session },
      );

      await session.commitTransaction();
      return { message: 'Payments deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default new PaymentService();
