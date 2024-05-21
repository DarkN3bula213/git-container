import { Logger } from '@/lib/logger';
import { createUserSession } from './session.model';
// const logger = new Logger(__filename);
import { config } from '@/lib/config';
import { type Job, Queue } from 'bullmq';

const connection = {
  host: config.isDevelopment ? 'localhost' : process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  password: undefined,
};

export const myQueue = new Queue('saveSessionQueue', { connection });

// import { Worker } from 'bullmq';

// const worker = new Worker(
//   'saveSessionQueue',
//   async (job: Job) => {
//     // Process job here, e.g., save user session
//     return createUserSession(
//       job.data.userID,
//       job.data.startTime,
//       job.data.endTime,
//       job.data.timeSpent,
//     );
//   },
//   { connection },
// );

const DEFAULT_REMOVE_CONFIG = {
  removeOnComplete: {
    age: 3600,
  },
  removeOnFail: {
    age: 24 * 3600,
  },
};

export async function addJobToQueue(
  userID: string,
  startTime: Date,
  endTime: Date,
  time: string,
) {
  return myQueue.add(
    'saveUserSession',
    createUserSession(userID, startTime, endTime, time),
    DEFAULT_REMOVE_CONFIG,
  );
}

// export async function addSaveSessionJob(
//   userID: string,
//   startTime: Date,
//   endTime: Date,
//   time: string,
// ) {
//   await worker.add(
//     'saveUserSession',
//     {
//       userID,
//       startTime,
//       endTime,
//       time,
//     },
//     {
//       jobId: `save-session-${userID}`,
//       delay: 300000, // 5 minutes delay
//     },
//   );
// }

// export async function removeSaveSessionJob(userID: string) {
//   const job = await saveSessionQueue.getJob(`save-session-${userID}`);
//   if (job) {
//     await job.remove();
//     logger.debug(
//       `Cancelled session save for user ${userID} due to reconnection.`,
//     );
//   }
// }
