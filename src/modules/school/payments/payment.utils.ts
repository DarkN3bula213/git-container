import { socketService } from '@/index';
import { Logger } from '@/lib/logger';
import paymentQueue from './payment.queue';

export const getPayId = () => {
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYear = String(currentDate.getFullYear()).slice(-2);

  return `${currentMonth}${currentYear}`;
};

const logger = new Logger(__filename);
interface JobResult {
  jobId: string;
  success: boolean;
  result?: any;
  error?: any;
}
interface BatchStatus {
  total: number;
  completed: JobResult[];
  failed: JobResult[];
}

export const batches = new Map<string, BatchStatus>();

export function checkIfBatchCompleted(batchId: string) {
  const batch = batches.get(batchId);
  if (batch && batch.completed.length + batch.failed.length === batch.total) {
    logger.info(`Batch ${batchId} completed. Preparing report...`);
    prepareBatchReport(batchId);
  }
}

export function prepareBatchReport(batchId: string) {
  const batch = batches.get(batchId);
  if (batch) {
    logger.debug({
      event: `Batch report for ${batchId}`,
      successes: batch.completed.length,
      failures: batch.failed.length,
    });
    socketService.emit('batchReport', {
      result: {
        id: batchId,
        total: batch.total,
        completed: batch.completed,
        failed: batch.failed,
      },
    });
    // Clean up after report
    batches.delete(batchId);
  }
}

export function addJobsToQueue(
  studentIds: string[],
  userId: string,
  batchId: string,
) {
  const jobIds = [];
  for (const studentId of studentIds) {
    const jobId = `${batchId}-${studentId}`;
    paymentQueue.add({ studentId, userId }, { jobId });
    jobIds.push(jobId);
  }
  batches.set(batchId, { total: studentIds.length, completed: [], failed: [] });
}
