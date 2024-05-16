import Bull, { type Queue } from 'bull';
import { mailService } from './';
import { Logger } from '@/lib/logger';
import { redisOptions } from '@/lib/constants';

const logger = new Logger(__filename);

export const mailQueue: Queue = new Bull('mailQueue', redisOptions);

mailQueue.process(async (job, done) => {
  try {
    const { to, subject, text, html } = job.data;
    await mailService.sendMail(to, subject, text, html);

    done(null);
  } catch (error) {
    logger.error(`Error processing mail job: ${error}`);
    done(error as Error);
  }
});
