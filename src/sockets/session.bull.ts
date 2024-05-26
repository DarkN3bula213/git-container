import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import Queue, { type Job } from 'bull';
import { createUserSession } from './session.model';

const logger = new Logger(__filename);

class SessionSaveQueue {
  private sessionQueue: Queue.Queue;

  constructor() {
    this.sessionQueue = new Queue('session-save', {
      redis: config.redis.uri,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.sessionQueue.on('completed', (job) => {
      logger.info(`Job completed: ${job.id}`);
    });

    this.sessionQueue.on('failed', (job, err) => {
      logger.error(`Job failed: ${job.id}, Error: ${err.message}`);
    });
  }

  public async addSession(data: any) {
    await this.sessionQueue.add(data);
  }

  public async processJob(job: Job) {
    try {
      await this.processSession(job.data);
    } catch (error) {
      logger.error(`Failed to process session job: ${error}`);
      throw error;
    }
  }

  private async processSession(data: any) {
    const { userID, startTime, endTime, time } = data;
    try {
      await createUserSession(userID, startTime, endTime, time);
      logger.info(`Saved session for user ${userID}`);
    } catch (error) {
      logger.error(`Failed to save session for user ${userID}: ${error}`);
      throw error; // Ensure the job is marked as failed
    }
  }
}

export const sessionQueue = new SessionSaveQueue();
