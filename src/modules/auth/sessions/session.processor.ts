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
		logger.info(`Processing job ${job.id} for user ${job.data.userID}`);
		try {
			const { userID, startTime, endTime, time } = job.data;
			await createUserSession(userID, startTime, endTime, time);
			logger.info(`Session saved for user ${userID}`);
			done();
		} catch (error: any) {
			logger.error(
				`Error saving session for user ${job.data.userID}: ${error.message}`
			);
			done(error);
		}
	}
};

export const saveSessionQueue = QueueFactory.createQueue('saveSession', {
	saveUserSession: sessionProcessor.saveUserSession
});

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
	try {
		const job = await saveSessionQueue.add(
			'saveUserSession',
			{ userID, startTime, endTime, time },
			{ jobId: `save-session-${userID}`, delay: 300000 } // 5-minute delay
		);
		logger.debug(`Job ${job.id} queued for user ${userID}`);
	} catch (error: any) {
		logger.error(
			`Failed to add save session job for user ${userID}: ${error.message}`
		);
		throw error;
	}
}

export async function removeSaveSessionJob(userID: string) {
	try {
		// Retrieve the job by its ID
		const job = await saveSessionQueue.getJob(`save-session-${userID}`);

		if (job) {
			await job.remove();
			logger.debug(`Reconnection: Queued job removed `);
		} else {
			logger.warn(
				`No queued job found for user ${userID} on reconnection.`
			);
		}
	} catch (error: any) {
		logger.error(
			`Failed to remove save session job for user ${userID}: ${error.message}`
		);
		throw error;
	}
}
