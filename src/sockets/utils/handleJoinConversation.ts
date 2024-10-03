import { Logger } from '@/lib/logger';
import { getAllConversationsForUser } from '@/modules/conversations/conversation.utils';
import { Socket } from 'socket.io';

const logger = new Logger(__filename);

export const handleJoinConversation = async (
	socket: Socket,
	userId: string,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const conversations = await getAllConversationsForUser(userId);
	const onlineUsers = Array.from(connectedUsers.values()).map((user) => ({
		userId: user.userId,
		username: user.username
	}));
	socket.emit('init', {
		currentUser: {
			userId,
			username: socket.data.username,
			socketId: socket.id
		},
		onlineUsers,
		conversations
	});
	logger.warn('Joined conversation');
};
