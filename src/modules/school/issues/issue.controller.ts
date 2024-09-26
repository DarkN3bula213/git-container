import { BadRequestError, SuccessResponse } from '@/lib/api';
import { config } from '@/lib/config';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { User } from '@/modules/auth/users/user.model';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import IssueModel from './issue.model';
import IssueService from './issue.service';

const logger = new Logger(__filename);

export const createIssue = asyncHandler(async (req, res) => {
	let user;
	if (!config.isTest) {
		user = req.user as User;
	} else {
		user = {
			_id: new Types.ObjectId('5f4e8d3d9d1e4c001f7e8e6a'),
			email: ''
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

export const getAllIssues = asyncHandler(async (_req, res) => {
	const issues = await IssueService.getAllIssues();
	return new SuccessResponse('Issues', issues).send(res);
});

export const getIssueById = asyncHandler(async (req, res) => {
	const id = req.params;
	logger.warn({
		event: 'Issue Fetch',
		issueId: JSON.stringify(id)
	});
	const issue = await IssueModel.findById(id).lean().exec();
	return new SuccessResponse('Issue', issue).send(res);
});

export const updateIssue = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const issue = await IssueService.updateIssue(
		new Types.ObjectId(id),
		req.body
	);
	if (issue) {
		res.status(200).json(issue);
	} else {
		res.status(404).json({ message: 'Issue not found' });
	}
});

export const resetCollection = asyncHandler(async (_req, res) => {
	await IssueModel.deleteMany({});
	return new SuccessResponse('Issue Collection reset successfully', {}).send(
		res
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
		userId._id
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
		user._id
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

export const getIssueAndUpdateSeenBy = asyncHandler(
	async (req: Request, res: Response): Promise<Response> => {
		const id = req.params.id;
		if (!id) {
			return res
				.status(400)
				.json({ message: 'Issue ID must be provided' });
		}

		const user = req.user as User;
		if (!user) {
			return res.status(401).json({
				message: 'User authentication required'
			});
		}

		const issue = await IssueModel.findById(id);

		if (!issue) {
			return res.status(404).json({ message: 'Issue not found' });
		}

		// Convert userId to a MongoDB ObjectId

		if (!issue.seenBy) {
			issue.seenBy = [];
		}
		let isSeen = false;
		// Check if the user's _id is already in the seenBy array
		if (!issue.seenBy.find((id) => id.equals(user._id))) {
			// Add the user's _id to the seenBy array
			issue.seenBy.push(user._id);
			isSeen = true;
			// Save the updated issue
			await issue.save();

			return res.status(200).json({
				...issue.toObject(),
				isSeen
			});
		} else {
			// If the user has already seen the issue, just return it
			return res.status(200).json(issue);
		}
	}
);
