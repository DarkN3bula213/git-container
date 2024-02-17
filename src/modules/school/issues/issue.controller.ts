import { Request, Response } from 'express';
import IssueService from './issue.service';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Types } from 'mongoose';
import { BadRequestError } from '@/lib/api';
import { User } from '@/modules/auth/users/user.model';

export const createIssue = asyncHandler(async (req, res) => {
  const issue = await IssueService.createIssue(req.body);
  res.status(201).json(issue);
});

export const getAllIssues = asyncHandler(async (req, res) => {
  const issues = await IssueService.getAllIssues();
  res.status(200).json(issues);
});

export const getIssueById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const _id = new Types.ObjectId(id);
  const issue = await IssueService.getIssueById(_id);
  if (issue) {
    await IssueService.markIssueAsSeen(_id);
    res.status(200).json(issue);
  } else {
    res.status(404).json({ message: 'Issue not found' });
  }
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

export const deleteIssue = asyncHandler(async (req, res) => {
  await IssueService.deleteIssue(req.params.id as unknown as Types.ObjectId);
  res.status(204).send();
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
