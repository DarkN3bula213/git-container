import { Logger } from '@/lib/logger';
import { getAllConversationsForUser } from '@/modules/conversations/conversation.utils';

import { Socket } from 'socket.io';

// Assuming logger is set up
const logger = new Logger(__filename);
// Handle user connection and prevent duplicate sessions
export const manageUserConnection = async (
	socket: Socket,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const userId = socket.data.userId as string;
	const user = socket.data.user;

	logger.warn('User Manager Invoked');

	if (!userId || !user) {
		logger.error('User not authenticated, cannot manage connection.');
		return;
	}

	if (connectedUsers.has(userId)) {
		// User is reconnecting
		const existingUser = connectedUsers.get(userId);
		if (existingUser && existingUser.socketId !== socket.id) {
			// Update the socketId if it has changed
			existingUser.socketId = socket.id;
			connectedUsers.set(userId, existingUser);
			logger.info(
				`User ${existingUser.username} reconnected with socketId ${socket.id}`
			);
		}
	} else {
		// New user connection
		connectedUsers.set(userId, {
			userId: userId,
			username: user.username,
			socketId: socket.id
		});
		logger.info(
			`New user ${user.username} connected with socketId ${socket.id}`
		);
	}

	// Only broadcast user list update if the users list has actually changed
	socket.broadcast.emit(
		'userListUpdated',
		Array.from(connectedUsers.values())
	);
};

// Broadcast updated user list to all other sockets
export const broadcastUserList = (
	socket: Socket,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const users = Array.from(connectedUsers.values());
	socket.broadcast.emit('userListUpdated', users);
};

// Emit current user data to the connected socket
export const emitCurrentUser = (
	socket: Socket,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const userId = socket.data.userId as string;
	const currentUser = connectedUsers.get(userId);
	if (currentUser) {
		socket.emit('currentUser', currentUser);
		logger.info(`Emitted currentUser for user ${currentUser.username}`);
	} else {
		socket.emit('error', { message: 'User not found' });
	}
};

export const handleInitialUser = async (
	socket: Socket,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const userId = socket.data.userId as string;
	const existingUser = connectedUsers.get(userId);
	const conversations = await getAllConversationsForUser(userId);
	const data = {
		currentUser: existingUser,
		onlineUsers: Array.from(connectedUsers.values()),
		conversations: conversations
	};

	socket.emit('userListUpdated', data);
};

export default manageUserConnection;
