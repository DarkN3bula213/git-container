import { Logger } from '@/lib/logger';
import Bull from 'bull';
import StudentModel from '../students/student.model';
import { ClassModel } from '../classes/class.model';
import paymentModel from './payment.model';
import { batches, checkIfBatchCompleted, getPayId } from './payment.utils';
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

    const grade = await ClassModel.findById(student.classId);
    if (!grade) {
      throw new Error('Grade not found');
    }

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

paymentQueue.on('completed', (job, result) => {
  const batchId = String(job.opts.jobId)?.split('-')[0];
  const batch = batches.get(batchId);
  if (batch) {
    batch.completed.push({ jobId: String(job.id), success: true, result });
    checkIfBatchCompleted(batchId);
  }
});

paymentQueue.on('failed', (job, err) => {
  const batchId = String(job.opts.jobId).split('-')[0];
  const batch = batches.get(batchId);
  if (batch) {
    batch.failed.push({
      jobId: String(job.id),
      success: false,
      error: err.message,
    });
    checkIfBatchCompleted(batchId);
  }
});

paymentQueue.on('progress', (job, progress) => {
  console.log(`Job ID: ${job.id} is ${progress}% complete`);
  logger.debug({
    event: 'Payment Job Progress',
    jobId: job.id,
    progress: progress,
  });
});

export default paymentQueue;
