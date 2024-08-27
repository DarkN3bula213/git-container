import asyncHandler from '@/lib/handlers/asyncHandler';
import ConversationModel from './conversation.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { User } from '../auth/users/user.model';

export const getConversations = asyncHandler(async (req, res) => {
  const user = req.user as User;

  if (!user) throw new BadRequestError('User not found');
  const conversations = await ConversationModel.find({ userId: user._id });
  new SuccessResponse('Conversations retrieved', conversations).send(res);
});

export const createConversation = asyncHandler(async (req, res) => {
  const { title, participants } = req.body;
  const user = req.user as User;

  if (!user) throw new BadRequestError('User not found');
  const conversation = new ConversationModel({
    title,
    participants,
    createdBy: user._id,
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
    { new: true },
  );
  if (!conversation) throw new BadRequestError('Conversation not found');
  new SuccessResponse('Conversation updated', conversation).send(res);
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await ConversationModel.findByIdAndDelete(req.params.id);
  if (!conversation) throw new BadRequestError('Conversation not found');
  new SuccessResponse('Conversation deleted', {}).send(res);
});
