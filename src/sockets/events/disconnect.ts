import { cache } from '@/data/cache/cache.service';
import { Logger } from '@/lib/logger';
import { Server, type Socket } from 'socket.io';
import { addSaveSessionJob } from '../../modules/auth/sessions/session.processor';
import { calculateTimeSpent } from '../../modules/auth/sessions/socket.utils';
import { getStartTimeFromCache } from '../utils/getStartTimeFromCache';

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
	const rooms = io.sockets.adapter.rooms;
	rooms.forEach((sockets, room) => {
		console.log(`Room: ${room}, Sockets: ${Array.from(sockets)}`);
	});
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

	/*=============================================
	=            Section comment block            =
	=============================================*/

	const sessionId = socket.data.sessionId as string;
	const username = socket.data.username as string;

	logger.info(
		`Handling disconnect for user ${username} (sessionId: ${sessionId})`
	);
	const matchingSockets = await io.in(userId).fetchSockets();
	const isDisconnected = matchingSockets.length === 0;

	console.log(`Status disconnected: ${isDisconnected}`);

	if (isDisconnected) {
		// User is fully disconnected
		connectedUsers.delete(userId);
		logger.info(`User ${userId} disconnected completely`);

		// Notify other users
		const onlineUsers = Array.from(connectedUsers.values());
		socket.broadcast.emit('userListUpdated', onlineUsers);
	} else {
		logger.info(
			`User ${userId} still connected with ${matchingSockets.length} socket(s)`
		);
	}
	if (connectedUsers.has(sessionId)) {
		connectedUsers.delete(sessionId);
		logger.info(
			`User ${username} disconnected and removed from connectedUsers`
		);

		// Log the total number of connected users
		logger.info(
			`Total connected users after disconnect: ${connectedUsers.size}`
		);

		// Broadcast updated user list
		const onlineUsers = Array.from(connectedUsers.values());
		socket.broadcast.emit('userListUpdated', onlineUsers);
		logger.debug('Broadcasted updated user list after disconnect', {
			onlineUsers
		});

		// Emit a system message if needed
		io.emit('systemMessage', {
			message: `User ${username} disconnected`,
			timestamp: new Date().toISOString()
		});
	} else {
		logger.info(
			`User ${username} disconnected but was not found in connectedUsers`
		);
	}
	/*=====  End of Section comment block  ======*/

	if (connectedUsers && connectedUsers.has(userId)) {
		io.emit('systemMessage', {
			message: `User ${socket.data.username} disconnected`,
			timestamp: new Date().toISOString()
		});
		connectedUsers.delete(userId);
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