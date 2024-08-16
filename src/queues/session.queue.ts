import { DoneCallback, Job } from 'bull';
import QueueFactory from '.';
import { Logger } from '@/lib/logger';
import { createUserSession } from '@/sockets/session.model';

const logger = new Logger(__filename);

const sessionProcessor = {
  saveUserSession: async (
    job: Job<{ userID: string; startTime: Date; endTime: Date; time: string }>,
    done: DoneCallback,
  ) => {
    logger.info(`Processing job: ${job.id} for user ${job.data.userID}`);

    try {
      const { userID, startTime, endTime, time } = job.data;
      await createUserSession(userID, startTime, endTime, time);
      logger.info(`Successfully saved session for user ${userID}`);
      done();
    } catch (error: any) {
      logger.error(
        `Error saving session for user ${job.data.userID}: ${error.message}`,
      );
      done(error);
    }
  },
};

export const saveSessionQueue = QueueFactory.createQueue(
  'saveSession',
  sessionProcessor,
);

// Logging when a new job is added to the queue
saveSessionQueue.on('added', (job) => {
  logger.info(
    `Job ${job.id} added to saveSessionQueue for user ${job.data.userID}`,
  );
});

// Logging when a job completes successfully
saveSessionQueue.on('completed', (job) => {
  logger.info(
    `Job ${job.id} completed successfully for user ${job.data.userID}`,
  );
});

// Logging when a job fails
saveSessionQueue.on('failed', (job, err) => {
  logger.error(
    `Job ${job.id} failed for user ${job.data.userID}: ${err.message}`,
  );
});
