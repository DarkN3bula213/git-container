import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import Queue, { type Job } from 'bull';
import { createUserSession } from './session.model';
const logger = new Logger(__filename);

class SessionSaveQueue {
  private sessionQueue: Queue.Queue<any>;
  private readonly retries = 3;

  constructor() {
    this.sessionQueue = new Queue('session-save', config.redis.uri);
  }

  queue() {
    return this.sessionQueue;
  }

  addSession(data: any) {
    this.sessionQueue.add(data, {
      attempts: this.retries,
    });
  }

  async initializeSession(job: Job) {
    const postPayload = job.data;
    await this.processSession(postPayload);
  }

  async processSession(data: any) {
    try {
      const { userID, startTime, endTime, time } = data;
      await createUserSession(userID, startTime, endTime, time);
      logger.info(`Saved session for user ${userID}`);
    } catch (error: any) {
      logger.error(`Failed to save session for user ${data.userID}: ${error}`);
      throw error; // Propagate error to mark job as failed
    }
  }
}

export const sessionQueue = new SessionSaveQueue();
