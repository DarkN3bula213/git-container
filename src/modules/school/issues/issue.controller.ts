import { Request, Response } from 'express';
import IssueService from './issue.service';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Types } from 'mongoose';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { User } from '@/modules/auth/users/user.model';
import { Logger } from '@/lib/logger';
import IssueModel from './issue.model';
import { config } from '@/lib/config';
const logger = new Logger(__filename);

export const createIssue = asyncHandler(async (req, res) => {
  let user;
  if (!config.isTest) {
    user = req.user as User;
  } else {
    user = {
      _id: new Types.ObjectId('5f4e8d3d9d1e4c001f7e8e6a'),
      email: '',
    };
  }
  const data = { ...req.body, author: user._id };
  const issue = await IssueService.createIssue(data);
  // logger.debug({
  //   event: 'Issue Creation',
  //   issue: issue,
  // });
  // return new SuccessResponse('Issue created successfully', issue).send(res);
  res.status(201).json(issue);
});

export const getAllIssues = asyncHandler(async (req, res) => {
  const issues = await IssueService.getAllIssues();
  return new SuccessResponse('Issues', issues).send(res);
});

export const getIssueById = asyncHandler(async (req, res) => {
  const id = req.params;
  logger.warn({
    event: 'Issue Fetch',
    issueId: JSON.stringify(id),
  });
  const issue = await IssueModel.findById(id).lean().exec();
  return new SuccessResponse('Issue', issue).send(res);
});

export const updateIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const issue = await IssueService.updateIssue(
    new Types.ObjectId(id),
    req.body,
  );
  if (issue) {
    res.status(200).json(issue);
  } else {
    res.status(404).json({ message: 'Issue not found' });
  }
});

export const resetCollection = asyncHandler(async (req, res) => {
  await IssueModel.deleteMany({});
  return new SuccessResponse('Issue Collection reset successfully', {}).send(
    res,
  );
});

export const deleteUnreadReply = asyncHandler(async (req, res) => {
  const { issueId, replyIndex } = req.params;
  if (!req.user) {
    throw new BadRequestError('No user found');
  }
  const userId = req.user as User;
  const result = await IssueService.deleteUnreadReply(
    new Types.ObjectId(issueId),
    parseInt(replyIndex),
    userId._id,
  );
  res.status(200).json(result);
});

export const addReply = asyncHandler(async (req, res) => {
  const { issueId } = req.body;
  const user = req.user as User;
  const replyData = { author: user._id, ...req.body };
  const issue = await IssueService.addReplyToIssue(issueId, replyData);
  res.json(issue);
});

export const removeIssueOrReply = asyncHandler(async (req, res) => {
  const { issueId, replyIndex } = req.params;
  const user = req.user as User;
  const result = await IssueService.deleteIssueOrReply(
    issueId,
    replyIndex,
    user._id,
  );
  res.status(200).json(result);
});

// Assuming asyncHandler is a utility to handle async await with automatic error catching
export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const user = req.user as User;
  const userId = user._id; // Make sure req.user is populated with authenticated user's data
  await IssueService.deleteIssue(issueId, userId);
  res.json({ message: 'Issue successfully deleted' });
});

export const deleteReply = asyncHandler(async (req: Request, res: Response) => {
  const { issueId, replyId } = req.params;
  const user = req.user as User;
  const userId = user._id; // Make sure req.user is populated with authenticated user's data
  await IssueService.deleteReply(issueId, replyId, userId);
  res.json({ message: 'Reply successfully deleted' });
});
