import { redisOptions } from '@/lib/constants';
import { Logger } from '@/lib/logger';
import Bull from 'bull';
import { createUserSession } from './session.model';
const logger = new Logger(__filename);

export const saveSessionQueue = new Bull('saveSessionQueue', redisOptions);

saveSessionQueue.on('completed', (job) => {
  logger.info(`Job completed: ${job.id}`);
});

saveSessionQueue.on('failed', (job, err) => {
  logger.error(`Job failed: ${job.id}, Error: ${err}`);
});

// Handle the 'saveUserSession' job type
saveSessionQueue.process(async (job) => {
  // Process job here, e.g., save user session
  return createUserSession(
    job.data.userID,
    job.data.startTime,
    job.data.endTime,
    job.data.timeSpent,
  );
});

export async function addSaveSessionJob(
  userID: string,
  startTime: Date,
  endTime: Date,
  time: string,
) {
  await saveSessionQueue.add(
    'saveUserSession',
    {
      userID,
      startTime,
      endTime,
      time,
    },
    {
      jobId: `save-session-${userID}`,
      delay: 300000, // 5 minutes delay
    },
  );
}

export async function removeSaveSessionJob(userID: string) {
  const job = await saveSessionQueue.getJob(`save-session-${userID}`);
  if (job) {
    await job.remove();
    logger.debug(
      `Cancelled session save for user ${userID} due to reconnection.`,
    );
  }
}
