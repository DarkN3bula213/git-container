import { Logger } from '@/lib/logger';
import {
	getAllConversationsForUser,
	saveMessageInConversation
} from '@/modules/conversations/conversation.utils';
import { Server, Socket } from 'socket.io';
import { emitMessage } from '../utils/emitMessage';
import { getConversationId } from '../utils/getConversationId';

const logger = new Logger(__filename);

export const handleMessages = async (
	socket: Socket,
	io: Server,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	socket.on('requestConversationId', handleRequestConversationId(socket));
	socket.on('privateMessage', handlePrivateMessage(socket, io));
	socket.on('typing', handleTyping(socket, io));
	socket.on('stoppedTyping', handleStoppedTyping(socket, io));
	socket.on(
		'joinConversation',
		async () => await handleJoinConversation(socket, connectedUsers)
	);
};

const handleRequestConversationId =
	(socket: Socket) => async (userId: string) => {
		const conversationId = await getConversationId(userId, socket);
		socket.emit('conversationId', conversationId || null);
	};

const handlePrivateMessage =
	(socket: Socket, io: Server) =>
	async ({
		toUserId,
		message,
		conversationId
	}: {
		toUserId: string;
		message: string;
		conversationId: string;
	}) => {
		const fromUserId = socket.data.userId as string;

		if (!conversationId) {
			socket.emit('messageError', { message: 'Conversation not found' });
			return;
		}

		try {
			const savedMessage = await saveMessageInConversation({
				conversationId,
				senderId: fromUserId,
				content: message
			});

			emitMessage(io, {
				receivers: [toUserId, fromUserId],
				event: 'messageReceived',
				payload: {
					conversationId,
					sender: fromUserId,
					message: savedMessage.content,
					timestamp: savedMessage.timestamp
				}
			});

			logger.info(
				`Message sent from user ${fromUserId} to user ${toUserId}`
			);
		} catch (error) {
			socket.emit('messageError', { message: 'Failed to send message' });
			logger.error('Error sending message', error);
		}
	};

const handleTyping =
	(socket: Socket, io: Server) =>
	({
		toUserId,
		conversationId
	}: {
		toUserId: string;
		conversationId: string;
	}) => {
		emitMessage(io, {
			receivers: [toUserId],
			event: 'userTyping',
			payload: { conversationId, userId: socket.data.userId }
		});
	};

const handleStoppedTyping =
	(socket: Socket, io: Server) =>
	({
		toUserId,
		conversationId
	}: {
		toUserId: string;
		conversationId: string;
	}) => {
		emitMessage(io, {
			receivers: [toUserId],
			event: 'userStoppedTyping',
			payload: { conversationId, userId: socket.data.userId }
		});
	};

const handleJoinConversation = async (
	socket: Socket,
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>
) => {
	const userId = socket.data.userId as string;
	socket.join(userId);
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
};
