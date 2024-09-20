import { Logger } from '@/lib/logger';
import {
	generateConversationKey,
	getOrCreateConversation,
	saveMessageInConversation
} from '@/modules/conversations/conversation.utils';

import { Socket } from 'socket.io';

// function socketMiddlewareWrapper(middleware: (socket: Socket, next: NextFunction) => void) {
//   return (socket: Socket, next: NextFunction) => {
//     middleware(socket, next);
//   };
// }
// function invalidateCacheMiddleware(cacheKey: string) {
//   return (socket: Socket, next: NextFunction) => {
//     // Invalidate cache logic here
//     console.log(`Invalidating cache for key: ${cacheKey}`);
//     next();
//   };
// }
const logger = new Logger(__filename);

export const handleMessageEvents = (
	socket: Socket,
	connectedUsers: Map<string, any>
) => {
	// On Requesting Conversation ID
	socket.on('requestConversationId', async (userId) => {
		const conversationId = await getConversationId(userId, socket);
		if (conversationId) {
			socket.emit('conversationId', conversationId);
		} else {
			socket.emit('conversationId', null);
		}
	});

	socket.on(
		'privateMessage',
		async ({ toUserId, message, conversationId }) => {
			const userId = socket.data.userId;
			// const username = socket.data.username;
			const recipient = connectedUsers.get(toUserId);

			if (!conversationId) {
				socket.emit('messageError', {
					message: 'Conversation not found'
				});
				return;
			}

			if (recipient) {
				console.log(
					`Recipient found: ${recipient.username},conversationId: ${conversationId}, userId: ${userId}`
				);
				try {
					// Save the message in the conversation
					const savedMessage = await saveMessageInConversation({
						conversationId: conversationId,
						senderId: userId,
						content: message
					});

					// Emit the message to the recipient
					socket.to(recipient.socketId).emit('messageReceived', {
						conversationId, // Make sure to include conversationId
						sender: userId,
						message: savedMessage.content,
						timestamp: savedMessage.timestamp
					});

					logger.info(
						`Message sent to user ID: ${toUserId} (socket ID: ${recipient.socketId})`
					);
				} catch (error) {
					socket.emit('messageError', {
						message: 'Failed to send message'
					});
					logger.error('Error sending message', error);
				}
			} else {
				socket.emit('messageError', {
					message: 'User not found or disconnected'
				});
				logger.warn(
					`Recipient with user ID: ${toUserId} not found or disconnected`
				);
			}
		}
	);
};

const getConversationId = async (userId: string, socket: Socket) => {
	const user = socket.data.user;
	if (!user) {
		logger.error('User not found in socket data');
		return null;
	}
	try {
		const key = generateConversationKey(user._id, userId);

		const conversation = await getOrCreateConversation(key[0], key[1]);
		if (!conversation) {
			logger.error('Conversation not found');
			return null;
		}
		return conversation._id;
	} catch (error) {
		logger.error('Error getting conversation ID:', error);
		return null;
	}
};
