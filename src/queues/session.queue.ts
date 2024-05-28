import { DoneCallback, Job } from 'bull';
import QueueFactory from '.';
import { Logger } from '@/lib/logger';
import { createUserSession } from '@/sockets/session.model';
const sessionProcessor = {
  saveUserSession: async (
    job: Job<{ userID: string; startTime: Date; endTime: Date; time: string }>,
    done: DoneCallback,
  ) => {
    const { userID, startTime, endTime, time } = job.data;
    await createUserSession(userID, startTime, endTime, time);
    done();
  },
};

export const saveSessionQueue = QueueFactory.createQueue(
  'saveSession',
  sessionProcessor,
);
