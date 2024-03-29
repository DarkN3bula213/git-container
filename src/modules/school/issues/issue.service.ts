import { Types } from 'mongoose';
import IssueModel, { Issue, Reply } from './issue.model';
import { BadRequestError } from '@/lib/api';

class IssueService {
  // Create a new issue
  static async createIssue(issueData: Partial<Issue>) {
    const issue = new IssueModel(issueData);
    await issue.save();
    return issue;
  }
  static async addReplyToIssue(issueId: string, replyData: Partial<Reply>) {
    const issue = await IssueModel.findById(issueId);
    if (!issue) throw new Error('Issue not found');

    issue.replies.push(replyData as Reply);
    await issue.save();
    return issue;
  }
  static async deleteIssueOrReply(
    userId: string,
    issueId: string,
    replyId?: string,
  ) {
    if (replyId) {
      // Delete a reply if replyId is provided
      const issue = await IssueModel.findById(issueId);
      if (!issue) throw new Error('Issue not found');
      const replyIndex = issue.replies.findIndex(
        (reply) =>
          reply._id.toString() === replyId &&
          reply.author.toString() === userId,
      );
      if (replyIndex > -1) {
        issue.replies.splice(replyIndex, 1);
        await issue.save();
        return { message: 'Reply deleted successfully' };
      }
      throw new Error(
        'Reply not found or user not authorized to delete this reply',
      );
    } else {
      // Delete the whole issue if only issueId is provided
      const deletionResult = await IssueModel.deleteOne({
        _id: issueId,
        author: userId,
      });
      if (deletionResult.deletedCount === 0) {
        throw new Error(
          'Issue not found or user not authorized to delete this issue',
        );
      }
      return { message: 'Issue deleted successfully' };
    }
  }

  // Get a list of all issues
  static async getAllIssues() {
    return await IssueModel.find();
  }

  // Get a single issue by ID
  static async getIssueById(issueId: Types.ObjectId) {
    return await IssueModel.findById(issueId);
  }

  // Update an issue by ID
  static async updateIssue(issueId: Types.ObjectId, issueData: Partial<Issue>) {
    const issue = await IssueModel.findByIdAndUpdate(issueId, issueData, {
      new: true,
    });
    return issue;
  }

  // Delete an issue by ID

  // Mark an issue as seen
  static async markIssueAsSeen(issueId: Types.ObjectId) {
    const issue = await IssueModel.findByIdAndUpdate(
      issueId,
      { isSeen: true },
      { new: true },
    );
    return issue;
  }
  // Delete an unread reply (simplified version)
  static async deleteUnreadReply(
    issueId: Types.ObjectId,
    replyIndex: number,
    userId: Types.ObjectId,
  ) {
    const issue = await IssueModel.findById(issueId);

    if (!issue) {
      throw new Error('Issue not found');
    }

    // Verify if the requester is the author of the issue
    if (!issue.author.equals(userId)) {
      throw new Error('Only the author can delete replies');
    }

    // Assuming replies are simple strings and not seen individually
    // This would be more complex with an array of objects for replies
    if (issue.replies.length > replyIndex) {
      issue.replies.splice(replyIndex, 1); // Remove the reply at the specified index
      await issue.save();
      return { message: 'Reply deleted successfully' };
    } else {
      throw new Error('Reply not found');
    }
  }

  // Method to delete an issue
  static async deleteIssue(issueId: string, userId: string) {
    const deletionResult = await IssueModel.deleteOne({
      _id: issueId,
      author: userId,
    });
    if (deletionResult.deletedCount === 0) {
      throw new BadRequestError(
        'Issue not found or user not authorized to delete this issue',
      );
    }
    return { message: 'Issue deleted successfully' };
  }

  // Method to delete a reply within an issue
  static async deleteReply(issueId: string, replyId: string, userId: string) {
    const issue = await IssueModel.findById(issueId);
    if (!issue) throw new Error('Issue not found');

    const replyIndex = issue.replies.findIndex(
      (reply) =>
        reply._id.toString() === replyId && reply.author.toString() === userId,
    );
    if (replyIndex > -1) {
      issue.replies.splice(replyIndex, 1);
      await issue.save();
      return { message: 'Reply deleted successfully' };
    }
    throw new BadRequestError(
      'Reply not found or user not authorized to delete this reply',
    );
  }
}

export default IssueService;
