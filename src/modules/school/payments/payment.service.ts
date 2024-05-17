import { BadRequestError } from '@/lib/api';
import { Logger } from '@/lib/logger';
import type { User } from '@/modules/auth/users/user.model';
import { ClassModel } from '../classes/class.model';
import type { Student } from '../students/student.interface';
import StudentModel from '../students/student.model';
import paymentModel from './payment.model';
import { getPayId } from './payment.utils';

const logger = new Logger(__filename);

class PaymentService {
  private static instance: PaymentService;
  constructor(
    private Payments: typeof paymentModel,
    private Classes: typeof ClassModel,
  ) {}
  static getInstance() {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService(paymentModel, ClassModel);
    }
    return PaymentService.instance;
  }

  async createPayment(user: User, studentId: string): Promise<any> {
    const student = await StudentModel.findById(studentId);
    if (!student) throw new BadRequestError('Student not found');
    const grade = await this.Classes.findById(student.classId);
    if (!grade) throw new BadRequestError('Grade not found');

    const payId = getPayId(); // Month and year based ID
    const existingPayment = await this.Payments.findOne({
      studentId: student._id,
      payId,
    });

    if (existingPayment) {
      return new BadRequestError('Payment for this month already exists');
    }

    try {
      const paymentData = new this.Payments({
        studentId: student._id,
        classId: student.classId,
        className: grade.className,
        section: student.section,
        amount: grade.fee,
        paymentDate: new Date(),
        createdBy: user._id,
        paymentType: student.feeType,
        payId,
      });

      await paymentData.save();
      return paymentData;
    } catch (error: any) {
      logger.error(`Something went wrong... ${error.message}`);
    }
  }

  async createManyPayments(user: User, studentIds: string[]): Promise<any> {
    const students = await StudentModel.find({ _id: { $in: studentIds } });
    const classIds = students.map((student) => student.classId);
    const classes = await ClassModel.find({ _id: { $in: classIds } });

    const classInfoMap = new Map(
      classes.map((cls) => [cls._id.toString(), cls]),
    );

    // Check for existing payments

    const existingPayments = await this.Payments.find({
      studentId: { $in: studentIds },
      payId: getPayId(),
    });

    if (existingPayments.length) {
      logger.debug(`${existingPayments.length} payments already exists`);
      throw new BadRequestError('Payments for this month already exists');
    }

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

    const insertedPayments = await this.Payments.insertMany(records);

    return insertedPayments;
  }

  async createCustomPayment(
    studentId: string,
    payId: string,
    paymentType: string,
    user: User,
  ): Promise<any> {
    const student = await StudentModel.findById(studentId);
    if (!student) throw new BadRequestError('Student not found');
    const grade = await this.Classes.findById(student.classId);
    if (!grade) throw new BadRequestError('Grade not found');

    const records = new this.Payments({
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
  }
}

export default PaymentService.getInstance();
