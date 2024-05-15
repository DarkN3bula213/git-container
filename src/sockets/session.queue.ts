import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import Bull from 'bull';
import { createUserSession } from './session.model';
const logger = new Logger(__filename);

export const saveSessionQueue = new Bull('saveSessionQueue', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

saveSessionQueue.process(async (job, done) => {
  try {
    const { userID, startTime, endTime, time } = job.data;
    await createUserSession(userID, startTime, endTime, time); // Make sure this function is properly imported or defined
    done();
  } catch (error: any) {
    logger.error(
      `Failed to save session for user ${job.data.userID}: ${error}`,
    );
    done(error);
  }
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
      jobId: `save-session-${userID}`, // Unique job ID based on userID
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
