import { cache } from '@/data/cache/cache.service';
import { Logger } from '@/lib/logger';
import mongoose, { Types } from 'mongoose';
import ConversationModel, {
	IConversation,
	MessageModel
} from './conversation.model';

const logger = new Logger(__filename);

export const getOrCreateConversation = async (
	userId: string,
	recipientId: string
) => {
	let conversation = (await ConversationModel.findOne({
		participants: {
			$all: [new Types.ObjectId(userId), new Types.ObjectId(recipientId)]
		}
	})) as IConversation;

	if (!conversation) {
		conversation = new ConversationModel({
			participants: [userId, recipientId]
		});
		await conversation.save();
	}

	return conversation;
};

interface PopulatedChatUser {
	_id: mongoose.Types.ObjectId; // This is the raw ObjectId from the database
	username: string;
	socketId?: string;
	name: string;
	email: string;
	dob: Date;
	phone: string;
	address: string;
	isVerified: boolean;
	lastLogin: Date;
}
export const getAllConversationsForUser = async (userId: string) => {
	// Find conversations and populate participants and lastMessage
	const conversations = await ConversationModel.find({
		participants: new mongoose.Types.ObjectId(userId)
	})
		.populate<{ participants: PopulatedChatUser[] }>({
			path: 'participants',
			select: '_id username name email dob phone address isVerified lastLogin'
		})
		.populate<{
			lastMessage: {
				_id: mongoose.Types.ObjectId;
				content: string;
				sender: mongoose.Types.ObjectId;
				timestamp: Date;
			};
		}>({
			path: 'lastMessage',
			select: '_id message sender timestamp'
		})
		.exec();

	// Transform the participants and lastMessage fields for frontend consumption
	const transformedConversations = conversations.map((conversation) => ({
		...conversation.toObject(),
		conversationId: conversation._id,
		participants: conversation.participants.map((participant) => ({
			userId: participant._id.toString(),
			username: participant.username,
			socketId: participant.socketId,
			name: participant.name,
			email: participant.email,
			dob: participant.dob,
			phone: participant.phone,
			address: participant.address,
			isVerified: participant.isVerified,
			lastLogin: participant.lastLogin
		})),
		messages: conversation.messages
			.map((message) => ({
				conversationId: conversation._id?.toString(),
				sender: message.sender,
				message: message.content, // Ensure we use 'content' here
				timestamp: message.timestamp,
				messageId: message._id
			}))
			.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()), // Sort messages chronologically
		lastMessage: conversation.lastMessage
			? {
					messageId: conversation.lastMessage._id.toString(),
					message: conversation.lastMessage.content,
					senderId: conversation.lastMessage.sender.toString(),
					timestamp: conversation.lastMessage.timestamp
				}
			: null
	}));

	return transformedConversations;
};
export const saveMessageInConversation = async ({
	conversationId,
	senderId,
	content
}: {
	conversationId: string;
	senderId: string;
	content: string;
}) => {
	try {
		// Ensure conversationId and senderId are valid ObjectIds
		const validConversationId = new mongoose.Types.ObjectId(conversationId);
		const validSenderId = new mongoose.Types.ObjectId(senderId);

		// Save the new message
		const message = new MessageModel({
			conversationId: validConversationId,
			sender: validSenderId,
			content
		});

		const savedMessage = await message.save();

		// Log for debugging purposes
		logger.info(
			`Saved message ${savedMessage._id} to conversation ${conversationId}`
		);

		// Update the conversation with the new message and set it as the lastMessage
		await ConversationModel.findByIdAndUpdate(
			validConversationId,
			{
				$push: { messages: savedMessage },
				lastMessage: savedMessage._id
			},
			{ new: true } // Option to return the updated document
		);

		return savedMessage;
	} catch (error) {
		// Handle errors appropriately
		logger.error(`Error saving message: ${error}`);
		throw error;
	}
};
export const getMessagesForConversation = async (conversationId: string) => {
	const cacheKey = `messages:${conversationId}`;

	return cache.getWithFallback(cacheKey, async () => {
		const messages = await MessageModel.find({
			conversation: conversationId
		}).exec();
		return messages;
	});
};

export const generateConversationKey = (
	userId1: string,
	userId2: string
): string[] => {
	// Sort the user IDs to ensure the same cache key for both users
	const sortedIds = [userId1, userId2].sort((a, b) => a.localeCompare(b));
	return sortedIds;
};
