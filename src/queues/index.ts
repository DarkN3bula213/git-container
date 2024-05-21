import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import Bull, { type DoneCallback, type Job } from 'bull';

const logger = new Logger(__filename);

type ProcessorMap<T> = {
  [key: string]: (job: Job<T>, done: DoneCallback) => void;
};

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class QueueFactory {
  static createQueue<T>(name: string, processorMap: ProcessorMap<T>) {
    const queue = new Bull<T>(name, {
      redis: {
        host: config.isDevelopment
          ? 'localhost'
          : process.env.REDIS_HOST || 'redis',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    });

    // Register event listeners
    queue.on('completed', (job: Job<T>, _result) => {
      logger.info(`Job ${job.id} in queue ${name} has completed successfully.`);
    });

    queue.on('failed', (job: Job<T>, err: Error) => {
      logger.error(
        `Job ${job.id} in queue ${name} has failed with error: ${err.message}`,
      );
    });

    queue.on('progress', (job: Job<T>, progress: number) => {
      logger.debug(`Job ${job.id} in queue ${name} is ${progress}% complete.`);
    });

    // Register job processors based on the provided map
    // biome-ignore lint/complexity/noForEach: <explanation>
    Object.entries(processorMap).forEach(([jobType, handler]) => {
      queue.process(jobType, handler);
    });

    return queue;
  }
}

export default QueueFactory;
