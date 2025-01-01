import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { User } from '../auth/users/user.model';
import ConversationModel, {
	Conversation,
	MessageModel
} from './conversation.model';

const logger = new Logger(__filename);

export const getConversations = asyncHandler(async (req, res) => {
	const user = req.user as User;

	if (!user) throw new BadRequestError('User not found');
	const conversations = await ConversationModel.find({
		userId: user._id
	});
	new SuccessResponse('Conversations retrieved', conversations).send(res);
});

export const createConversation = asyncHandler(async (req, res) => {
	const { title, participants } = req.body;
	const user = req.user as User;

	if (!user) throw new BadRequestError('User not found');
	const conversation = new ConversationModel({
		title,
		participants,
		createdBy: user._id
	});
	await conversation.save();
	new SuccessResponse('Conversation created', conversation).send(res);
});

export const getConversationById = asyncHandler(async (req, res) => {
	const conversation = await ConversationModel.findById(req.params.id);
	if (!conversation) throw new BadRequestError('Conversation not found');
	new SuccessResponse('Conversation retrieved', conversation).send(res);
});

export const updateConversation = asyncHandler(async (req, res) => {
	const conversation = await ConversationModel.findByIdAndUpdate(
		req.params.id,
		req.body,
		{ new: true }
	);
	if (!conversation) throw new BadRequestError('Conversation not found');
	new SuccessResponse('Conversation updated', conversation).send(res);
});

export const deleteConversation = asyncHandler(async (req, res) => {
	const conversation = await ConversationModel.findByIdAndDelete(
		req.params.id
	);
	if (!conversation) throw new BadRequestError('Conversation not found');
	new SuccessResponse('Conversation deleted', {}).send(res);
});

export const getOrCreateConversationId = asyncHandler(async (req, res) => {
	const { userId } = req.body;
	const user = req.user as User;
	if (!user) throw new BadRequestError('User not found');
	const key = getDynamicKey(DynamicKey.CONVERSATION, `${userId}:${user._id}`);

	const checkcache = await cache.get<string>(key);
	if (checkcache) {
		logger.info(`Cache hit for ${key}`);
		return new SuccessResponse(
			'Conversation retrieved',
			JSON.parse(checkcache)
		).send(res);
	}

	const conversation = (await ConversationModel.findOne({
		participants: { $all: [user._id, userId] }
	})) as Conversation;
	if (!conversation) {
		const newConversation = new ConversationModel({
			participants: [user._id, userId]
		}) as any;
		await newConversation.save();
		cache.setExp(key, JSON.stringify(newConversation), 60 * 60 * 24);

		return new SuccessResponse(
			'Conversation created',
			newConversation
		).send(res);
	} else {
		return new SuccessResponse('Conversation retrieved', conversation).send(
			res
		);
	}
});

export const getConversationMessages = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const messages = await MessageModel.find({ conversation: id })
		.populate('sender')
		.populate('conversation');
	new SuccessResponse('Conversation messages retrieved', messages).send(res);
});

export const deleteMessage = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const user = req.user as User;
	const userId = user._id;

	const message = await MessageModel.findById(id);

	if (message?.sender !== userId) {
		throw new BadRequestError('Cannot delete other users messages');
	}

	await MessageModel.findByIdAndDelete(message?._id);

	return new SuccessResponse('Message deleted', {}).send(res);
});
