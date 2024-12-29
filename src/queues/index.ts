import { config } from '@/lib/config';
import { ProductionLogger } from '@/lib/logger/v1/logger';
import Bull, { DoneCallback, Job, Queue } from 'bull';

const logger = new ProductionLogger(__filename);

type ProcessorFunction<T> = (job: Job<T>, done: DoneCallback) => Promise<void>;

type ProcessorMap<T> = {
	[key: string]: ProcessorFunction<T>;
};

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class QueueFactory {
	static createQueue<T>(
		name: string,
		processorMap: ProcessorMap<T>
	): Queue<T> {
		const queue = new Bull<T>(name, {
			redis: config.redis.uri,
			defaultJobOptions: {
				attempts: 3,
				backoff: {
					type: 'exponential',
					delay: 1000
				}
			}
		});

		// Register event listeners
		queue.on('completed', (job: Job<T>) => {
			logger.info(
				`Job ${job.id} in queue ${name} completed successfully.`
			);
		});

		queue.on('failed', (job: Job<T>, err: Error) => {
			logger.error(
				`Job ${job.id} in queue ${name} failed: ${err.message}`
			);
		});

		queue.on('progress', (job: Job<T>, progress: number) => {
			logger.debug(
				`Job ${job.id} in queue ${name} is ${progress}% complete.`
			);
		});

		queue.on('active', (job: Job<T>) => {
			logger.info(`Job ${job.id} in queue ${name} is now active.`);
		});

		queue.on('stalled', (job: Job<T>) => {
			logger.warn(`Job ${job.id} in queue ${name} has stalled.`);
		});

		// Register processors
		Object.entries(processorMap).forEach(([jobType, handler]) => {
			queue.process(jobType, handler);
		});

		logger.info(`Queue ${name} initialized with processors.`);

		return queue;
	}

	static async removeJob<T>(queueName: string, jobId: string): Promise<void> {
		const queue = new Bull<T>(queueName, {
			redis: config.redis.uri
		});

		try {
			const job = await queue.getJob(jobId);
			if (job) {
				await job.remove();
				logger.info(
					`Job ${jobId} removed successfully from queue ${queueName}.`
				);
			} else {
				logger.warn(`Job ${jobId} not found in queue ${queueName}.`);
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			logger.error(
				`Failed to remove job ${jobId} from queue ${queueName}: ${error.message}`
			);
			throw error;
		}
	}
}

export default QueueFactory;
