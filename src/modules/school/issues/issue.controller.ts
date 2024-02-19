import { Request, Response } from 'express';
import IssueService from './issue.service';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Types } from 'mongoose';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { User } from '@/modules/auth/users/user.model';
import { Logger } from '@/lib/logger';
import IssueModel, { Reply } from './issue.model';
const logger = new Logger(__filename);

export const createIssue = asyncHandler(async (req, res) => {
  const user = req.user as User;
  const data = {
    author: user._id,
    title: req.body.title,
    description: req.body.description,
  };
  const issue = await IssueService.createIssue(data);
  logger.debug({
    event: 'Issue Creation',
    issue: issue,
  });
  return new SuccessResponse('Issue created successfully', issue).send(res);
});

export const getAllIssues = asyncHandler(async (req, res) => {
  const user = req.user as User;
  const userId = user._id.toString();
  const issues = await IssueModel.find()
   
    .exec();
  const enhancedIssues = issues.map((issue) => {
    const isSeenByUser = issue.seenBy.some(
      (seenUserId) => seenUserId.toString() === userId,
    );
    return {
      ...issue.toObject(),
      isNew: !isSeenByUser, // True if the user hasn't seen the issue, false otherwise
    };
  });

  return new SuccessResponse(
    'Issues fetched successfully',
    enhancedIssues,
  ).send(res);
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

export const getById = asyncHandler(async (req: Request, res: Response) => {
const { _id: issueId } = req.params;
 logger.debug({
   event: 'Issue Seen',
   issueId: JSON.stringify(issueId),
 })
  const user = req.user as User;
  const userId = user._id.toString();
  const issue = await IssueModel.findById(
    issueId
  );

  if (!issue) {
    return res.status(404).send({ message: 'Issue not found' });
  }

  const hasUserSeen = issue.seenBy.some(
    (seenUserId) => seenUserId.toString() === userId,
  );

  if (!hasUserSeen) {
    // Use $addToSet to avoid duplicates
    const update = await IssueModel.findByIdAndUpdate(
      issueId,
      {
        $addToSet: { seenBy: user._id },
      },
   
    );
    logger.debug({
      event: 'Issue Updated',
      issue: update,
    });
    return new SuccessResponse('Issue seen successfully', update).send(res);
  } else {
    logger.debug({
      event: 'Issue Seen',
      issue: issue,
    });
    return new SuccessResponse('Issue seen successfully', issue).send(res);
  }

  //...
});

export const resetCollection = asyncHandler(async (req, res) => {
  await IssueModel.deleteMany();
return new SuccessResponse('Collection reset successfully',{}).send(res);
})



export const pushReply = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const { content } = req.body;
    const user = req.user as User; // Assuming user authentication is in place

    // Create and save the new Reply
    const newReply = new Reply({
      content,
      author: user._id,
      issue: issueId,
    });

    await newReply.save();

    // Optionally, update the issue to include this reply in its replies array
    await IssueModel.findByIdAndUpdate(issueId, {
      $push: { replies: newReply._id },
    });

    res.status(201).json(newReply);

})