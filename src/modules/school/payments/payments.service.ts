import { BadRequestError } from '@/lib/api';
import StudentModel from '../students/student.model';
import Payments from './payment.model';
import { generateSerial, getPayId } from './payment.utils';
import { Student } from '../students/student.interface';
import { InvoiceProps } from '@/types';
import { generateInvoiceToken } from '@/lib/utils/tokens';
import { generateQRCode } from '@/lib/utils/utils';
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);

class PaymentService {
  async getNextInvoiceId(): Promise<string> {
    const lastPayment = await Payments.findOne().sort({ createdAt: -1 }).exec();
    const currentDate = new Date();

    let lastCount = 0;
    if (lastPayment && lastPayment.invoiceId) {
      // Extract count and checkAlphabet from last invoiceId
      const { invoiceId } = lastPayment;
      const checkAlphabet = invoiceId.slice(3, 4);
      const counterSegment = parseInt(invoiceId.slice(4));

      if (counterSegment < 99) {
        lastCount = (checkAlphabet.charCodeAt(0) - 65) * 100 + counterSegment;
      } else {
        lastCount = (checkAlphabet.charCodeAt(0) - 65) * 100 + 99;
      }
    }

    return generateSerial(currentDate, lastCount + 1);
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
}

export default new PaymentService();
