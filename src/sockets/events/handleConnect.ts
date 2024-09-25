import { Logger } from '@/lib/logger';
import { getAllConversationsForUser } from '@/modules/conversations/conversation.utils';

import { type Socket } from 'socket.io';

import { removeSaveSessionJob } from '../../modules/auth/sessions/session.processor';
import { handleMessageEvents } from './handleMessages';
import { manageUserConnection } from './handleUsers';
import { authenticateUser } from './socket.events';

const logger = new Logger(__filename);

// Main connection handler
export const handleConnect = async (
	socket: Socket,

	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const authResult = authenticateUser(socket);
	if (!authResult) return;

	const { user, userID } = authResult;
	socket.data.user = user;
	socket.data.userId = userID;
	// await manageUserConnection(socket, connectedUsers);
	await removeSaveSessionJob(userID);

	socket.on('joinConversation', async () => {
		// First, manage the user's connection (either reconnect or new connect)
		await manageUserConnection(socket, connectedUsers);

		const userId = socket.data.userId;
		if (!userId) {
			logger.error('User ID missing, cannot join conversation.');
			return;
		}

		// Get the user's conversations
		const conversations = await getAllConversationsForUser(userId);
		const connection = connectedUsers.get(userId);
		if (connection) {
			// Emit all necessary data in a single 'init' event
			const data = {
				currentUser: connection,
				onlineUsers: Array.from(connectedUsers.values()), // This includes all the online users
				conversations: conversations // All conversations relevant to the user
			};

			socket.emit('init', data);
			logger.info(
				`Init data sent to user ${connection.username} with socketId ${socket.id}`
			);
		}
	});
	handleMessageEvents(socket, connectedUsers);
};
