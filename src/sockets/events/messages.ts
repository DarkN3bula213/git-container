import { Logger } from '@/lib/logger';
import {
	getAllConversationsForUser,
	saveMessageInConversation
} from '@/modules/conversations/conversation.utils';
import { ConnectedUser } from '@/types/connectedUsers';
import { Server, Socket } from 'socket.io';
import { emitMessage } from '../utils/emitMessage';
import { getConversationId } from '../utils/getConversationId';
import { getOnlineUsers } from '../utils/getOnlineUsers';
import { SignalData } from './room-manager';
import { broadcastUserList } from './socket.events';

const logger = new Logger(__filename);

// Main handler function for messages and calls
export const handleMessages = async (
	socket: Socket,
	io: Server,
	connectedUsers: Map<string, ConnectedUser>
) => {
	// Set up event listeners
	socket.on('requestConversationId', handleRequestConversationId(socket));
	socket.on('privateMessage', handlePrivateMessage(socket, io));
	socket.on('typing', handleTyping(socket, io));
	socket.on('stoppedTyping', handleStoppedTyping(socket, io));
	socket.on(
		'joinConversation',
		async () => await handleJoinConversation(socket, connectedUsers)
	);
	socket.on('callUser', handleCallUser(socket, io));
	socket.on('answerCall', handleAnswerCall(socket, io));
	socket.on('setAvailability', handleSetAvailability(socket, connectedUsers));
};

// Handle request for conversation ID
const handleRequestConversationId =
	(socket: Socket) => async (userId: string) => {
		try {
			const conversationId = await getConversationId(userId, socket);
			socket.emit('conversationId', conversationId || null);
		} catch (error) {
			logger.error('Error fetching conversation ID', error);
			socket.emit('messageError', {
				message: 'Failed to fetch conversation ID'
			});
		}
	};

// Handle sending a private message
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

// Handle typing event
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

// Handle stopped typing event
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

// Handle joining a conversation
// Handle joining a conversation
const handleJoinConversation = async (
	socket: Socket,
	connectedUsers: Map<string, ConnectedUser>
) => {
	try {
		const userId = socket.data.userId as string;
		const sessionId = socket.data.sessionId as string;
		socket.join(userId);

		// Get user's conversations
		const conversations = await getAllConversationsForUser(userId);

		// Update user's availability when joining conversation
		const currentUser = connectedUsers.get(sessionId);
		if (currentUser) {
			currentUser.isAvailable = true;
			connectedUsers.set(sessionId, currentUser);
		}

		// Get available users (excluding self)
		const availableUsers = getOnlineUsers(connectedUsers, userId);

		// Send initial data to the user
		socket.emit('init', {
			currentUser: {
				userId,
				username: socket.data.username,
				socketId: socket.id,
				isAvailable: true
			},
			onlineUsers: availableUsers,
			conversations
		});

		// Broadcast updated user list to all clients
		broadcastUserList(socket, connectedUsers);

		logger.info(
			`User ${socket.data.username} (${userId}) joined conversation and is now available`
		);
	} catch (error) {
		logger.error('Error joining conversation', error);
		socket.emit('messageError', { message: 'Failed to join conversation' });
	}
};

// Handle call initiation
const handleCallUser =
	(socket: Socket, io: Server) =>
	async ({
		toUserId,
		signalData
	}: {
		toUserId: string;
		signalData: SignalData;
	}) => {
		const fromUserId = socket.data.userId as string;

		emitMessage(io, {
			receivers: [toUserId],
			event: 'callUser',
			payload: {
				signalData,
				fromUserId
			}
		});
		logger.info(
			`Call initiated from user ${fromUserId} to user ${toUserId}`
		);
	};

// Handle answering a call
const handleAnswerCall =
	(socket: Socket, io: Server) =>
	async ({
		toUserId,
		signalData
	}: {
		toUserId: string;
		signalData: SignalData;
	}) => {
		const fromUserId = socket.data.userId as string;

		emitMessage(io, {
			receivers: [toUserId],
			event: 'answerCall',
			payload: { signalData, fromUserId }
		});
		logger.info(`Call answered by user ${fromUserId} for user ${toUserId}`);
	};

export const handleSetAvailability =
	(socket: Socket, connectedUsers: Map<string, ConnectedUser>) =>
	(isAvailable: boolean) => {
		const sessionId = socket.data.sessionId as string;
		const user = connectedUsers.get(sessionId);
		if (user) {
			// Only update if availability actually changed
			user.isAvailable = isAvailable;
			connectedUsers.set(sessionId, user);
			broadcastUserList(socket, connectedUsers);

			logger.info(
				`User ${user.username} (${user.userId}) availability changed to ${isAvailable}`
			);
		}
	};
