import { Logger } from '@/lib/logger';
import {
	generateConversationKey,
	getOrCreateConversation
} from '@/modules/conversations/conversation.utils';
import { Socket } from 'socket.io';

const logger = new Logger(__filename);

export const getConversationId = async (userId: string, socket: Socket) => {
	const user = socket.data.userId;

	if (!user) {
		logger.error('User not found in socket data');
		return null;
	}
	try {
		const key = generateConversationKey(user, userId);
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
