import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import Bull, { DoneCallback, Job, Queue, QueueOptions } from 'bull';

const logger = new Logger(__filename);

type ProcessorFunction<T> = (job: Job<T>, done: DoneCallback) => Promise<void>;

type ProcessorMap<T> = {
	[key: string]: ProcessorFunction<T>;
};
const DEFAULT_DELAY = 5 * 60 * 1000; // 5 minutes in milliseconds
interface QueueCallbacks<T> {
	onComplete?: (job: Job<T>) => Promise<void> | void;
	onFailed?: (job: Job<T>, error: Error) => Promise<void> | void;
}
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class QueueFactory {
	static createQueue<T>(
		name: string,
		processorMap: ProcessorMap<T>,
		options: QueueOptions = {},
		callbacks: QueueCallbacks<T> = {}
	): Queue<T> {
		const queue = new Bull<T>(name, {
			redis: config.redis.uri,
			defaultJobOptions: {
				attempts: 3,
				delay: DEFAULT_DELAY,
				backoff: {
					type: 'exponential',
					delay: 1000
				},
				removeOnComplete: true
			},
			...options
		});

		// Register event listeners
		queue.on('completed', async (job: Job<T>) => {
			logger.info(
				`Job ${job.id} in queue ${name} completed successfully.`
			);
			if (callbacks?.onComplete) {
				try {
					await callbacks.onComplete(job);
				} catch (error: any) {
					logger.error(
						`Error in onComplete callback: ${error.message}`
					);
				}
			}
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
			logger.debug(`Job ${job.id} in queue ${name} is now active.`);
		});

		queue.on('stalled', (job: Job<T>) => {
			logger.debug(`Job ${job.id} in queue ${name} has stalled.`);
		});

		// Register processors
		Object.entries(processorMap).forEach(([jobType, handler]) => {
			queue.process(jobType, handler);
		});

		logger.debug(`Queue ${name} initialized with processors.`);

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
				logger.debug(
					`Job ${jobId} removed successfully from queue ${queueName}.`
				);
			} else {
				logger.debug(`Job ${jobId} not found in queue ${queueName}.`);
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			logger.error(
				`Failed to remove job ${jobId} from queue ${queueName}: ${error.message}`
			);
			throw error;
		}
	}
	static async cancelDelayedJob<T>(
		queue: Queue<T>,
		jobId: string,
		onSuccess?: () => void
	): Promise<boolean> {
		try {
			const job = await queue.getJob(jobId);
			if (!job) {
				logger.debug(`No job found with ID ${jobId} to cancel`);
				return false;
			}

			const state = await job.getState();
			if (state === 'delayed' || state === 'waiting') {
				await job.remove();
				logger.debug(`Successfully cancelled delayed job ${jobId}`);
				onSuccess?.();
				return true;
			}

			logger.debug(
				`Job ${jobId} is in state ${state} and cannot be cancelled`
			);
			return false;
		} catch (error: any) {
			logger.error(
				`Failed to cancel delayed job ${jobId}: ${error.message}`
			);
			throw error;
		}
	}
}

export default QueueFactory;
