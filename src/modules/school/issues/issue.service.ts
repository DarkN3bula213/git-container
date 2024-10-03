import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import { Request } from 'express';
import { Types } from 'mongoose';
import Issue, { IIssue, IReply, Reply } from './issue.model';

class IssueService {
	public static async createIssue(
		issueData: Partial<IIssue>,
		userId: Types.ObjectId
	): Promise<IIssue> {
		return await withTransaction(async (session) => {
			try {
				const newIssue = new Issue({
					...issueData,
					author: userId
				});

				return await newIssue.save({ session });
			} catch (error) {
				console.error('Failed to create issue:', error);
				throw new BadRequestError('Unable to create the issue.');
			}
		});
	}
	/**
	 * Get all issues.
	 */
	static async getIssues(): Promise<IIssue[]> {
		return await Issue.find()
			.populate('author', 'name email')
			.populate('replies')
			.exec();
	}

	/**
	 * Get an issue by ID.
	 */
	static async getIssueById(
		issueId: string,
		userId: Types.ObjectId
	): Promise<IIssue | null> {
		// Mark issue as seen by the user
		await Issue.findByIdAndUpdate(issueId, {
			$addToSet: { seenBy: userId }
		});

		return await Issue.findById(issueId)
			.populate('author', 'name email')
			.populate({
				path: 'replies',
				populate: { path: 'author', select: 'name email' }
			})
			.exec();
	}

	/**
	 * Update an issue.
	 */
	static async updateIssue(
		req: Request,
		issueId: string
	): Promise<IIssue | null> {
		const { title, priority, reference, label, description, attachment } =
			req.body;

		const updatedIssue = await Issue.findByIdAndUpdate(
			issueId,
			{ title, priority, reference, label, description, attachment },
			{ new: true }
		);

		return updatedIssue;
	}

	/**
	 * Delete an issue.
	 */
	static async deleteIssue(issueId: string): Promise<void> {
		await Issue.findByIdAndDelete(issueId);
		await Reply.deleteMany({ issue: issueId });
	}

	/**
	 * Add a reply to an issue.
	 */
	static async addReply(req: Request, issueId: string): Promise<IReply> {
		const { content } = req.body;
		const author = req?.user;

		const newReply = new Reply({
			issue: issueId,
			author,
			content
		});

		const savedReply = await newReply.save();

		await Issue.findByIdAndUpdate(issueId, {
			$push: { replies: savedReply._id }
		});

		return savedReply;
	}

	/**
	 * Mark a reply as seen.
	 */
	static async markReplyAsSeen(
		replyId: string,
		userId: Types.ObjectId
	): Promise<void> {
		await Reply.findByIdAndUpdate(replyId, {
			$addToSet: { seenBy: userId }
		});
	}
}

export default IssueService;
