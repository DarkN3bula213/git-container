import { Logger } from '@/lib/logger';
import Bull from 'bull';
import StudentModel from '../students/student.model';
import { ClassModel } from '../classes/class.model';
import paymentModel from './payment.model';
import { getPayId } from './payment.utils';
import { socketService } from '@/index';
import { config } from '@/lib/config';

const logger = new Logger(__filename);

// Configure the Bull queue
const paymentQueue = new Bull('paymentQueue', {
  redis: {
    host: config.isDevelopment
      ? 'localhost'
      : process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
  },
});

// Process payment creation jobs
paymentQueue.process(async (job, done) => {
  const { studentId, userId } = job.data;

  try {
    logger.info(`Attempting to find student with ID ${studentId}`);
    const student = await StudentModel.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    logger.info(
      `Found student, now looking for grade with ID ${student.classId}`,
    );
    const grade = await ClassModel.findById(student.classId);
    if (!grade) {
      throw new Error('Grade not found');
    }

    logger.info(`Creating payment record for student ID ${studentId}`);
    const paymentRecord = new paymentModel({
      studentId: student._id,
      classId: student.classId,
      className: grade.className,
      section: student.section,
      amount: grade.fee,
      paymentDate: new Date(),
      createdBy: userId,
      paymentType: student.feeType,
      payId: getPayId(),
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
});

export default paymentQueue;
