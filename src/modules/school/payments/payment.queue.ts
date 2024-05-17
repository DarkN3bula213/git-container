import { socketService } from '@/index';
import { Logger } from '@/lib/logger';
import QueueFactory from '@/queues';
import type Bull from 'bull';
import { ClassModel } from '../classes/class.model';
import StudentModel from '../students/student.model';
import paymentModel from './payment.model';
import { getPayId } from './payment.utils';

const logger = new Logger(__filename);

const processPaymentJob = async (
  job: Bull.Job<any>,
  done: Bull.DoneCallback,
) => {
  const { studentId, userId } = job.data;

  try {
    const student = await StudentModel.findById(studentId);
    if (!student) throw new Error('Student not found');

    const grade = await ClassModel.findById(student.classId);
    if (!grade) throw new Error('Grade not found');

    const paymentRecord = new paymentModel({
      studentId: student._id,
      classId: student.classId,
      className: grade.className,
      section: student.section,
      amount: grade.fee,
      paymentDate: new Date(),
      createdBy: userId,
      paymentType: student.feeType,
      payId: getPayId(), // Assuming getPayId() returns a static ID for demonstration
    });

    await paymentRecord.save();
    logger.info(
      `Payment record saved successfully for student ID ${studentId}`,
    );
    socketService.notifyPaymentSuccess(String(job.id), paymentRecord);
    done(null, paymentRecord);
  } catch (error: any) {
    logger.error(
      `Error processing payment for student ID ${studentId}: ${error.message}`,
    );
    socketService.notifyPaymentFailure(String(job.id), error.message);
    done(error);
  }
};

const paymentMap = {
  processPayment: processPaymentJob,
};

// Create the payment queue using the factory
const paymentQueue = QueueFactory.createQueue('paymentQueue', paymentMap);

export default paymentQueue;
