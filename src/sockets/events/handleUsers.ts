import { Logger } from '@/lib/logger';
import { getAllConversationsForUser } from '@/modules/conversations/conversation.utils';

import { Socket } from 'socket.io';

// Assuming logger is set up
const logger = new Logger(__filename);
// Handle user connection and prevent duplicate sessions
const manageUserConnection = async (
	socket: Socket,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const userId = socket.data.userId as string;
	const user = socket.data.user;
	const username = user.username as string;

	// If user already exists, update their socketId
	if (connectedUsers.has(userId)) {
		const existingUser = connectedUsers.get(userId);
		if (existingUser) {
			existingUser.socketId = socket.id;
			connectedUsers.set(userId, existingUser);
			logger.info(
				`Updated socketId for user ${username} to ${socket.id}`
			);
		}
	} else {
		// Add a new user connection
		connectedUsers.set(userId, {
			userId,
			username,
			socketId: socket.id
		});
		logger.info(
			`New user ${username} connected with socketId ${socket.id}`
		);
	}

	// Broadcast updated user list to others
	// broadcastUserList(socket, connectedUsers);

	// Fetch and emit conversations to the connected user
	try {
		// const conversations = await getAllConversationsForUser(userId);
		// socket.emit('conversationsLoaded', conversations);
		logger.info(`Sent conversations to user ${username}`);
	} catch (error: any) {
		logger.error(
			`Error sending conversations to user ${username}: ${error.message}`
		);
		socket.emit('error', { message: 'Failed to load conversations' });
	}
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
