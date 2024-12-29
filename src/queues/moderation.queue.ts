import { cache } from '@/data/cache/cache.service';
import { ProductionLogger } from '@/lib/logger/v1/logger';
import UserActivityLogModel from '@/modules/analytics/analytics';
import type { DoneCallback, Job } from 'bull';
import QueueFactory from '.';

const logger = new ProductionLogger(__filename);

const sessionProcessor = {
	moderation: async (
		job: Job<{ userID: string; sessionId: string }>,
		done: DoneCallback
	) => {
		const { userID, sessionId } = job.data;
		logger.debug(`Processing saveUserSession job for user ${userID}`);

		try {
			const logs = await cache.getClient().lRange(sessionId, 0, -1);
			const logEntries = logs.map((log) => JSON.parse(log));
			logger.debug(
				`Found ${logEntries.length} logs for session ${sessionId}`
			);

			// Ensure all required fields are present in the log entries
			const getRoutes = logEntries
				.filter((log) => log.method === 'GET')
				.map((log) => ({
					endpoint: log.url,
					frequency: 1,
					timestamps: [log.timestamp]
				}));

			const postRoutes = logEntries
				.filter((log) => log.method === 'POST')
				.map((log) => ({
					endpoint: log.url,
					frequency: 1,
					timestamps: [log.timestamp]
				}));
			// Create user activity log entry
			const sessionLog = new UserActivityLogModel({
				userId: userID,
				sessionId,
				startTime: logEntries[0].timestamp,
				endTime: logEntries[logEntries.length - 1].timestamp,
				duration: calculateDuration(
					logEntries[0].timestamp,
					logEntries[logEntries.length - 1].timestamp
				),
				getRoutes,
				postRoutes
			});
			logger.debug(`Processing saveUserSession job for user ${userID}`);
			const saveLog = await sessionLog.save();
			logger.debug(`User activity log saved for user ${saveLog}`);
			const invalidate = await cache.del(sessionId);
			logger.debug(`Session cache invalidated for user ${invalidate}`);

			done();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			logger.error(
				`Error processing saveUserSession job for user ${userID}: ${error}`
			);
			done(error);
		}
	}
};

export const moderationQueue = QueueFactory.createQueue(
	'moderation',
	sessionProcessor
);
const calculateDuration = (startTime: Date, endTime: Date): string => {
	const duration =
		new Date(endTime).getTime() - new Date(startTime).getTime();
	const hours = Math.floor(duration / 1000 / 60 / 60);
	const minutes = Math.floor((duration / 1000 / 60) % 60);
	return `${hours}h ${minutes}m`;
};
