// import { Logger } from '@/lib/logger';
import { getAllConversationsForUser } from '@/modules/conversations/conversation.utils';

import { type Socket } from 'socket.io';

import { removeSaveSessionJob } from '../../modules/auth/sessions/session.processor';
import { handleMessageEvents } from './handleMessages';
import manageUserConnection from './handleUsers';
import { authenticateUser } from './socket.events';

// const logger = new Logger(__filename);

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
	await manageUserConnection(socket, connectedUsers);
	await removeSaveSessionJob(userID);

	const users = Array.from(connectedUsers.values());

	socket.broadcast.emit('userListUpdated', users);
	// socket.emit('currentUser', connection);
	socket.on('requestUserList', () => {
		const users = Array.from(connectedUsers.values());
		socket.emit('userListUpdated', users);
	});
	// Handle messages
	socket.on('joinConversation', async () => {
		const connection = connectedUsers.get(userID);
		const conversations = await getAllConversationsForUser(userID);
		const data = {
			currentUser: connection,
			onlineUsers: Array.from(connectedUsers.values()),
			conversations: conversations
		};
		console.log(data);
		socket.emit('init', data);
	});
	handleMessageEvents(socket, connectedUsers);
};
