import { cache } from '@/data/cache/cache.service';
import { Logger } from '@/lib/logger';

import { Server, type Socket } from 'socket.io';

import { addSaveSessionJob } from '../../modules/auth/sessions/session.processor';
import { calculateTimeSpent } from '../../modules/auth/sessions/socket.utils';
import { getStartTimeFromCache } from './socket.events';

const logger = new Logger(__filename);

export const handleDisconnect = async (
	socket: Socket,
	io: Server,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const userID = socket.data.userId;
	const redisKey = `user:${userID}:startTime`;
	const userId = socket.data.userId;
	const startTime = await getStartTimeFromCache(userID, socket);
	if (!startTime) return; // If start time is missing, return early

	// Calculate the time spent in the session

	let session;
	try {
		session = calculateTimeSpent(new Date(startTime));
	} catch (error: any) {
		logger.error(
			`Error calculating time spent for user ${userID} on socket ${socket.id}: ${error.message}`
		);
		return;
	}

	try {
		await addSaveSessionJob(
			userID,
			session.startTime,
			session.endTime,
			session.time
		);
	} catch (error: any) {
		logger.error(
			`Failed to add job for user ${userID} on socket ${socket.id}: ${error.message}`
		);
	}

	// Clean up Redis key after job is queued
	await cache.del(redisKey);

	// Handle users if connected

	if (connectedUsers && connectedUsers.has(userId)) {
		connectedUsers.delete(userId);
		io.emit('systemMessage', {
			message: `User ${socket.data.username} disconnected`,
			timestamp: new Date().toISOString()
		});

		const updatedUsers = Array.from(connectedUsers.values());
		socket.broadcast.emit('userListUpdated', updatedUsers);
		socket.disconnect();
	} else {
		logger.info(
			`User ${socket.data.username} disconnected but not found in connectedUsers`
		);
		socket.disconnect();
	}
};
