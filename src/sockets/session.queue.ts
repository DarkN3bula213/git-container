import { config } from '@/lib/config';
import Bull from 'bull';
import { createUserSession } from './session.model';

export const saveSessionQueue = new Bull('saveSessionQueue', {
  redis: {
    host: config.isDevelopment
      ? 'localhost'
      : process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
  },
});

saveSessionQueue.process(async (job, done) => {
  try {
    const { userID, startTime, endTime, time } = job.data;
    await createUserSession(userID, startTime, endTime, time); // Make sure this function is properly imported or defined
    done();
  } catch (error: any) {
    console.error(
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
    console.log(
      `Cancelled session save for user ${userID} due to reconnection.`,
    );
  }
}
