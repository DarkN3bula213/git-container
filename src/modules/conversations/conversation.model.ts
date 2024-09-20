import { Logger } from '@/lib/logger';

import mongoose, { Document, InferSchemaType, Schema } from 'mongoose';

const logger = new Logger(__filename);
interface IMessage extends Document {
	sender: mongoose.Types.ObjectId;
	content: string;
	timestamp: Date;
	conversationId: mongoose.Types.ObjectId;
}

export interface IConversation extends Document {
	participants: mongoose.Types.ObjectId[];
	messages: IMessage[];
	createdAt: Date;
	updatedAt: Date;
	lastMessage: mongoose.Types.ObjectId;
}

const MessageSchema = new Schema<IMessage>({
	conversationId: {
		type: Schema.Types.ObjectId,
		ref: 'Conversation',
		required: true
	},

	sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	content: { type: String, required: true },
	timestamp: { type: Date, default: Date.now }
});

export type MessageType = InferSchemaType<typeof MessageSchema>;
export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);

const ConversationSchema = new Schema<IConversation>(
	{
		participants: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
				required: true
			}
		],
		messages: [MessageSchema],
		lastMessage: {
			type: Schema.Types.ObjectId,
			ref: 'Message'
		}
	},
	{ timestamps: true }
);
export type Conversation = InferSchemaType<typeof ConversationSchema>;
const ConversationModel = mongoose.model<IConversation>(
	'Conversation',
	ConversationSchema
);

export default ConversationModel;

export async function getOrCreateConversation(
	participants: mongoose.Types.ObjectId[]
): Promise<IConversation> {
	const existingConversation = (await ConversationModel.findOne({
		participants: { $all: participants }
	})) as IConversation;
	if (existingConversation) {
		logger.debug({
			message: 'Conversation found ',
			conversation: existingConversation._id
		});
		return existingConversation;
	}
	const newConversation = new ConversationModel({
		participants: participants,
		messages: []
	});
	logger.debug({
		message: 'Conversation created',
		conversation: newConversation._id
	});
	await newConversation.save();
	return newConversation;
}

export async function addMessageToConversation(
	conversationId: mongoose.Types.ObjectId,
	message: IMessage
): Promise<void> {
	await ConversationModel.updateOne(
		{
			_id: conversationId
		},
		{
			$push: {
				messages: message
			}
		}
	);
}

export const getAllConversationsForUser = async (userId: string) => {
	const conversations = await ConversationModel.find({
		participants: userId
	})
		.populate('lastMessage participants')
		.exec();

	return conversations;
};

export const saveMessageInConversation = async (
	conversationId: string,
	senderId: string,
	content: string
) => {
	const message = new MessageModel({
		sender: senderId,
		content,
		conversation: conversationId
	});

	const savedMessage = await message.save();

	// Update conversation with the last message
	await ConversationModel.findByIdAndUpdate(conversationId, {
		$push: { messages: savedMessage._id },
		lastMessage: savedMessage._id
	});

	return savedMessage;
};
