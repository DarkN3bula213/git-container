import { Types } from 'mongoose';
import IssueModel, { Issue } from './issue.model';

class IssueService {
  // Create a new issue
  static async createIssue(issueData: Partial<Issue>) {
    const issue = new IssueModel(issueData);
    await issue.save();
    return issue;
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
  static async deleteIssue(issueId: Types.ObjectId) {
    await IssueModel.findByIdAndDelete(issueId);
    return { message: 'Issue deleted successfully' };
  }
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
}

export default IssueService;
