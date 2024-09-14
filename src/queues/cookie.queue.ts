import { DoneCallback, Job } from 'bull';
import QueueFactory from '.';
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);
const cookieExpirationProcessor = {
   logExpiration: (
      job: Job<{ userId: string; expires: Date }>,
      done: DoneCallback
   ) => {
      const { userId, expires } = job.data;
      logger.info({
         event: 'Cookie Expiration',
         user: userId,
         expires
      });
      done();
   }
};

export const cookieExpirationQueue = QueueFactory.createQueue(
   'cookieExpiration',
   cookieExpirationProcessor
);
