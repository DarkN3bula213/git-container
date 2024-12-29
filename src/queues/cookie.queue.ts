import { ProductionLogger } from '@/lib/logger/v1/logger';
import { DoneCallback, Job } from 'bull';
import QueueFactory from '.';

const logger = new ProductionLogger(__filename);

export const cookieExpirationQueue = QueueFactory.createQueue(
	'cookieExpiration',
	{
		logExpiration: async (
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
	}
);
