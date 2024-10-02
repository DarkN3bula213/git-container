import { cache } from "@/data/cache/cache.service";
import { Logger } from "@/lib/logger";
import { Socket } from "socket.io";


const logger = new Logger(__filename)

  const getStartTimeFromCache = async (
	userID: string,
	socket: Socket
): Promise<Date | null> => {
	const redisKey = `user:${userID}:startTime`;
	const startTime = await cache.get<Date>(redisKey);

	if (!startTime) {
		logger.error(
			`StartTime missing in Redis for user ${userID} on socket ${socket.id}.`
		);
		return null;
	}

	return new Date(startTime);
};


const getOrSetStartTime = async (userID: string, socket: Socket) => {
	const redisKey = `user:${userID}:startTime`;
	const startTime = await cache.get<Date>(redisKey);

	if (startTime) {
		socket.data.startTime = new Date(startTime);
		logger.debug(`Found start time for user ${socket.data.user}`);
	} else {
		const newStartTime = new Date();
		socket.data.startTime = newStartTime;
		await cache.set(redisKey, newStartTime.toISOString());
		logger.info(
			`Set new startTime in Redis for user ${userID} on socket ${socket.id}`
		);
	}
};

export {
    getOrSetStartTime,
    getStartTimeFromCache
}