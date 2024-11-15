import { Logger } from '@/lib/logger';
import { ConnectedUser } from '@/types/connectedUsers';
import { Socket } from 'socket.io';
import { sendAdminMessage } from '../utils/emitMessage';

const logger = new Logger(__filename);

export const handleUsers = async (
	socket: Socket,
	connectedUsers: Map<string, ConnectedUser>
) => {
	const userId = socket.data.userId as string;
	const username = socket.data.username as string;
	const sessionId = socket.data.sessionId as string;

	if (!userId || !username || !sessionId) {
		logger.error('User not authenticated, cannot manage connection.');
		return;
	}

	logger.info(`Managing connection for user ${username} (${userId})`);

	handleExistingConnection(connectedUsers, sessionId, socket.id);

	joinUserRoom(socket);
	// Add/update the user in connectedUsers map
	connectedUsers.set(sessionId, {
		userId,
		username,
		socketId: socket.id
	});
	// console.dir(connectedUsers, {
	// 	depth: Infinity
	// });
	broadcastUserList(socket, connectedUsers);

	sendAdminMessage(socket, connectedUsers, `${username} connected`);
};

const handleExistingConnection = (
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>,
	sessionId: string,
	newSocketId: string
) => {
	if (connectedUsers.has(sessionId)) {
		const existingUser = connectedUsers.get(sessionId);
		if (existingUser && existingUser.socketId !== newSocketId) {
			connectedUsers.delete(sessionId);
			logger.warn(
				`Disconnecting duplicate connection for user with socketId ${existingUser.socketId}`
			);
		}
	}
};

const broadcastUserList = (
	socket: Socket,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const onlineUsers = Array.from(connectedUsers.values()).map((user) => ({
		socketId: user.socketId,
		userId: user.userId,
		username: user.username
	}));
	socket.broadcast.emit('userListUpdated', onlineUsers);
};
const joinUserRoom = (socket: Socket) => {
	const userId = socket.data.userId as string;
	if (userId) {
		socket.join(userId);
	} else {
		logger.warn(
			`Unable to join user room: userId not found in socket.data`
		);
	}
};
