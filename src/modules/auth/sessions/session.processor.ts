import { cache } from '@/data/cache/cache.service';
import { sessionJobKey, startTimeKey } from '@/data/cache/keys';
import { validateData } from '@/lib/handlers/validate';
import { Logger } from '@/lib/logger';
import QueueFactory from '@/queues';
import { DoneCallback, Job } from 'bull';
import { createUserSession } from './session.model';
import { sessionSchema } from './session.schema';

const logger = new Logger(__filename);
const sessionProcessor = {
	saveUserSession: async (
		job: Job<{
			userID: string;
			startTime: Date;
			endTime: Date;
			time: string;
		}>,
		done: DoneCallback
	) => {
		logger.debug({
			event: 'Processing job',
			jobId: job.id,
			userId: job.data.userID.slice(0, 5)
		});
		try {
			const { userID, startTime, endTime, time } = job.data;
			await createUserSession(userID, startTime, endTime, time);
			logger.info({
				event: 'Session saved',
				userId: userID.slice(0, 5)
			});
			done();
		} catch (error: any) {
			logger.error({
				event: 'Error saving session',
				message: error.message,
				userId: job.data.userID.slice(0, 5)
			});
			done(error);
		}
	}
};

export const saveSessionQueue = QueueFactory.createQueue(
	'saveSession',
	{
		saveUserSession: sessionProcessor.saveUserSession
	},
	{},
	{
		onComplete: async (job) => {
			const timeKey = startTimeKey(job.data.userID);
			await cache.del(timeKey);
		}
	}
);

// Job creation example
export async function addSaveSessionJob(
	userID: string,
	startTime: Date,
	endTime: Date,
	time: string
) {
	const data = { userID, startTime, endTime, time };

	// Validate the data before adding the job to the queue
	validateData(sessionSchema, data);
	const jobId = sessionJobKey(userID);
	try {
		const job = await saveSessionQueue.add(
			'saveUserSession',
			{ userID, startTime, endTime, time },
			{
				jobId: jobId
			}
		);
		logger.debug({
			event: `Job queued ${job.id}`
		});
	} catch (error: any) {
		logger.error({
			event: 'Error adding save session job',
			message: error.message,
			userId: userID.slice(0, 5)
		});
		throw error;
	}
}

export async function removeSaveSessionJob(userID: string) {
	try {
		const jobId = sessionJobKey(userID);
		// Retrieve the job by its ID
		const job = await saveSessionQueue.getJob(jobId);

		if (job) {
			await job.remove();
			logger.debug({
				event: 'Found job for user',
				userId: userID.slice(0, 5),
				jobId: job.id
			});
		} else {
			//  Silent return
			return;
		}
	} catch (error: any) {
		logger.error({
			event: 'Error removing save session job',
			message: error.message,
			userId: userID.slice(0, 5)
		});
		throw error;
	}
}
export async function cancelSessionEnd(userId: string): Promise<boolean> {
	const jobId = sessionJobKey(userId);
	return QueueFactory.cancelDelayedJob(saveSessionQueue, jobId);
}
