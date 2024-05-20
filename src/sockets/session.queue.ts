import { Logger } from '@/lib/logger';
import QueueFactory from '@/queues';
import type Bull from 'bull';
import { createUserSession } from './session.model';
const logger = new Logger(__filename);

// export const saveSessionQueue = new Bull('saveSessionQueue', redisOptions);

// saveSessionQueue.on('completed', (job) => {
//   logger.info(`Job completed: ${job.id}`);
// });

// saveSessionQueue.on('failed', (job, err) => {
//   logger.error(`Job failed: ${job.id}, Error: ${err}`);
// });

// // Handle the 'saveUserSession' job type
// saveSessionQueue.process('saveUserSession', async (job, done) => {
//   try {
//     const { userID, startTime, endTime, time } = job.data;
//     await createUserSession(userID, startTime, endTime, time);
//     logger.info(`Saved session for user ${userID}`);
//     done();
//   } catch (error: any) {
//     logger.error(
//       `Failed to save session for user ${job.data.userID}: ${error}`,
//     );
//     done(error);
//   }
// });

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
      // delay: 300000, // 5 minutes delay
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

const processSaveSessionJob = async (
  job: Bull.Job<any>,
  done: Bull.DoneCallback,
) => {
  const { userID, startTime, endTime, time } = job.data;
  try {
    await createUserSession(userID, startTime, endTime, time);
    logger.info(`Saved session for user ${userID}`);
    done();
  } catch (error: any) {
    logger.error(
      `Failed to save session for user ${job.data.userID}: ${error}`,
    );
    done(error);
  }
};
const processorMap = {
  saveUserSession: processSaveSessionJob,
};

const saveSessionQueue = QueueFactory.createQueue(
  'saveSessionQueue',
  processorMap,
);
