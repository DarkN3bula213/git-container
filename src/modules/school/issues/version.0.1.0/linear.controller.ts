import asyncHandler from '@/lib/handlers/asyncHandler';
import LinearIssueModel, { type LinearIssue } from './linear.model';
import { isAdminRolePresent, normalizeRoles } from '@/lib/utils/utils';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { Logger } from '@/lib/logger';
import { Types } from 'mongoose';
import service from './linear.service';
import addToIsSeenBy from './linear.utils';
const logger = new Logger('Linear Controller');

export const createLinearIssue = asyncHandler(async (req, res) => {
  const { description, title, tags, priority, status } = req.body;
  const user = req.user;

  if (!user) return new BadRequestError('No user found');
  const input: Partial<LinearIssue> = {
    description: description,
    title: title,
    tags: tags,
    priority: priority,
    status: status,
  };

  const userId = user._id;

  const issue = await service.createIssue(input, userId as string);

  return new SuccessResponse('Issue created', issue).send(res);
});

export const getAllLinearIssues = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new BadRequestError('No user found');

  const roles = normalizeRoles(user.roles);
  const isAdmin = await isAdminRolePresent(roles);
  const userId = user._id as string;
  const query = isAdmin
    ? { isReply: false }
    : { assignee: new Types.ObjectId(userId), isReply: false };

  // console.log('Query:', query)

  const issues = (await LinearIssueModel.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'linearissues', // Collection name for issues
        localField: '_id',
        foreignField: 'parent_ref',
        as: 'replies',
        pipeline: [
          { $match: { isReply: true } },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: 'linearissues',
              localField: '_id',
              foreignField: 'parent_ref',
              as: 'nestedReplies',
              pipeline: [
                { $match: { isReply: true } },
                { $sort: { createdAt: -1 } },
              ],
            },
          },
        ],
      },
    },
  ]).exec()) as LinearIssue[];

  // console.log('Issues:', issues)

  const filteredIssues: LinearIssue[] = isAdmin
    ? issues
    : issues.filter((issue) => issue.assignee.equals(userId));

  return new SuccessResponse('Issues', filteredIssues).send(res);
});

export const getLinearIssueById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  if (!user) throw new BadRequestError('No user found');

  const userId = user._id as string;

  const roles = normalizeRoles(user.roles);
  const isAdmin = await isAdminRolePresent(roles);
  await service.withTransaction(async (session) => {
    const issue = await LinearIssueModel.findById(id)
      .populate('replies', 'description isSeen createdAt')
      .session(session)
      .exec();

    if (!issue) {
      throw new BadRequestError('No issue found');
    }

    // Update isSeenBy array
    if (user) {
      addToIsSeenBy(issue, userId);
    }

    // Update isSeen and status for admins
    if (isAdmin && !issue.isSeen) {
      issue.isSeen = true;
      issue.status = 'inProgress';
    }

    await issue.save({ session });

    new SuccessResponse('Issue', issue).send(res);
  });
});

export const updateLinearIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const issue = (await LinearIssueModel.findByIdAndUpdate(id, req.body, {
    new: true,
  })) as LinearIssue;
  if (issue) {
    return new SuccessResponse('Issue updated', issue).send(res);
  }
});

export const resetLinearCollection = asyncHandler(async (req, res) => {
  await LinearIssueModel.deleteMany({});
  return new SuccessResponse('Issue Collection reset successfully', {}).send(
    res,
  );
});

export const deleteLinearIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const issue = (await LinearIssueModel.findByIdAndDelete(id)) as LinearIssue;
  if (issue) {
    return new SuccessResponse('Issue deleted', issue).send(res);
  }
});

export const addReply = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const { description } = req.body;

  const user = req.user;

  if (!user) return new BadRequestError('No user found');
  const userId = new Types.ObjectId(user._id as string);

  const roles = normalizeRoles(user.roles);
  const isAdmin = isAdminRolePresent(roles);

  const issue = (await LinearIssueModel.findById(issueId)) as LinearIssue;
  if (!issue) throw new BadRequestError('No issue found');

  const isMine = issue.assignee.equals(userId);

  if (!isAdmin) {
    const newReply = new LinearIssueModel({
      parent_ref: issueId,
      title: issue.title,
      description: description,
      isReply: true,
      isSeen: false,
      assignee: user._id,
      priority: issue.priority,
      tags: issue.tags,
      status: issue.status,
      isUserGenerated: !!isMine,
      // lastResponder: user._id
    });
    await newReply.save();

    const pushReply = await LinearIssueModel.findByIdAndUpdate(
      issueId,
      {
        $push: { replies: newReply._id },
        $set: { lastResponder: user._id },
      },

      { new: true },
    );
    logger.debug({
      issueId: issueId,
      description: description,
      isMine: isMine,
    });
    await toggleIsSeen(issue._id as Types.ObjectId, false);
    return new SuccessResponse('Reply added', issue).send(res);
  }
  const newReply = service.addAdminsReply(issueId, description, isMine, userId);

  return new SuccessResponse('Reply added', newReply).send(res);
});

const toggleIsSeen = async (
  issueId: Types.ObjectId,
  seenStatus: boolean,
): Promise<void> => {
  try {
    await LinearIssueModel.findByIdAndUpdate(
      issueId,
      { isSeen: seenStatus },
      { new: true },
    );
  } catch (error) {
    console.error('Failed to update isSeen status:', error);
    throw new Error('Unable to update the issue.');
  }
};

export const changeIssueStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  logger.debug({ id: id, status: status });
  const issue = (await LinearIssueModel.findByIdAndUpdate(
    id,
    { status: status },
    { new: true },
  )) as LinearIssue;

  if (!issue) {
    throw new BadRequestError('No issue found');
  }
  return new SuccessResponse('Issue status updated', issue).send(res);
});

interface UpdateIssueRequestBody {
  status?: LinearIssue['status'];
  priority?: LinearIssue['priority'];
  tags?: LinearIssue['tags'];
  isArchived?: LinearIssue['isArchived'];
}

const allowedFields: (keyof UpdateIssueRequestBody)[] = [
  'status',
  'priority',
  'tags',
  'isArchived',
];

const filterUpdateFields = (
  body: UpdateIssueRequestBody,
): Partial<UpdateIssueRequestBody> => {
  const updateFields: Partial<UpdateIssueRequestBody> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      updateFields[field] = body[field] as any;
    }
  }
  return updateFields;
};

export const changeIssueFields = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateFields = filterUpdateFields(req.body);
  console.log({ updateFields }, 'updateFields');
  if (Object.keys(updateFields).length === 0) {
    throw new BadRequestError('No valid fields provided for update');
  }

  logger.debug({ id: id, updateFields });

  const issue = (await LinearIssueModel.findByIdAndUpdate(id, updateFields, {
    new: true,
  })) as LinearIssue;

  if (!issue) {
    throw new BadRequestError('No issue found');
  }

  return new SuccessResponse('Issue updated successfully', issue).send(res);
});

export const toggleIsArchived = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const issue = (await LinearIssueModel.findById(id)) as LinearIssue;
  if (!issue) {
    throw new BadRequestError('No issue found');
  }

  issue.isArchived = !issue.isArchived;
  await issue.save();

  return new SuccessResponse('Issue archived status updated', issue).send(res);
});
