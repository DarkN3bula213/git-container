import { cache } from '@/data/cache/cache.service';
import { startTimeKey } from '@/data/cache/keys';
import { Logger } from '@/lib/logger';
import { convertToSeconds } from '@/lib/utils/fns';
import { Socket } from 'socket.io';

const logger = new Logger(__filename);

const getStartTimeFromCache = async (
	userID: string
	// socket: Socket
): Promise<Date | null> => {
	const redisKey = startTimeKey(userID);
	const startTime = await cache.get<Date>(redisKey);

	if (!startTime) {
		logger.error(`No start time found for user ${userID}`);
		return null;
	}

	return new Date(startTime);
};

const getOrSetStartTime = async (userID: string, socket: Socket) => {
	const redisKey = startTimeKey(userID);
	const startTime = await cache.get<Date>(redisKey);

	if (startTime) {
		socket.data.startTime = new Date(startTime);
		logger.info(`Start time restored and set in socket data`);
	} else {
		const newStartTime = new Date();
		socket.data.startTime = newStartTime;
		await cache.setExp(
			redisKey,
			newStartTime.toISOString(),
			convertToSeconds('4h')
		);
		logger.debug({
			event: 'Set new start time in Redis',
			userId: socket.data.user
		});
	}
};

export { getOrSetStartTime, getStartTimeFromCache };
