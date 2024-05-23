import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import Bull from 'bull';
import { createUserSession } from './session.model';

const logger = new Logger(__filename);

const redisConfig = {
  host: config.isDevelopment ? 'localhost' : process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  password: undefined, // Use a password if necessary
};

export const saveSessionQueue = new Bull('saveSessionQueue', {
  redis: redisConfig,
});

saveSessionQueue.on('completed', (job) => {
  logger.info(`Job completed: ${job.id}`);
});

saveSessionQueue.on('failed', (job, err) => {
  logger.error(`Job failed: ${job.id}, Error: ${err}`);
});

saveSessionQueue.process('saveUserSession', async (job) => {
  try {
    const { userID, startTime, endTime, time } = job.data;
    await createUserSession(userID, startTime, endTime, time);
    logger.info(`Saved session for user ${userID}`);
  } catch (error: any) {
    logger.error(
      `Failed to save session for user ${job.data.userID}: ${error}`,
    );
    throw error; // Propagate error to mark job as failed
  }
});

export async function addSaveSessionJob(
  userID: string,
  startTime: Date,
  endTime: Date,
  time: string,
) {
  try {
    await saveSessionQueue.add(
      'saveUserSession',
      {
        userID,
        startTime,
        endTime,
        time,
      },
      {
        jobId: `save-session-${userID}`, // Unique job ID based on userID
        delay: 300000, // 5 minutes delay
      },
    );
  } catch (error: any) {
    logger.error(`Failed to add save session job for user ${userID}: ${error}`);
    throw error;
  }
}

export async function removeSaveSessionJob(userID: string) {
  try {
    const job = await saveSessionQueue.getJob(`save-session-${userID}`);
    if (job) {
      await job.remove();
      logger.debug(
        `Cancelled session save for user ${userID} due to reconnection.`,
      );
    }
  } catch (error: any) {
    logger.error(
      `Failed to remove save session job for user ${userID}: ${error}`,
    );
    throw error;
  }
}
