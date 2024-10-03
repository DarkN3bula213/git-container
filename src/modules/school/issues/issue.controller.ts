import { convertToObjectId } from '@/data/database/db.utils';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { User } from '@/modules/auth/users/user.model';
import { Request, Response } from 'express';
import IssueService from './issue.service';

const logger = new Logger(__filename);
export const createIssue = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = convertToObjectId(user._id);
	logger.debug({
		body: JSON.stringify(req.body)
	});
	const issue = await IssueService.createIssue(req.body, userId);
	return new SuccessResponse('Issue created', issue).send(res);
});

export const getIssue = asyncHandler(async (req: Request, res: Response) => {
	const issueId = req.params.id;
	const user = req.user as User;
	const userId = user._id;
	const issue = await IssueService.getIssueById(issueId, userId);
	if (!issue) {
		throw new BadRequestError('Issue not found');
	}
	return new SuccessResponse('Issue retrieved', issue).send(res);
});

export const getAllIssues = asyncHandler(
	async (req: Request, res: Response) => {
		const issues = await IssueService.getIssues();
		return new SuccessResponse('Issues retrieved', issues).send(res);
	}
);

export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
	const issueId = req.params.id;
	const updateData = req.body;
	const updatedIssue = await IssueService.updateIssue(updateData, issueId);
	if (!updatedIssue) {
		throw new BadRequestError('Issue not found or update failed');
	}
	return new SuccessResponse('Issue updated', updatedIssue).send(res);
});

export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
	const issueId = req.params.id;
	await IssueService.deleteIssue(issueId);
	return new SuccessResponse('Issue deleted', {}).send(res);
});
