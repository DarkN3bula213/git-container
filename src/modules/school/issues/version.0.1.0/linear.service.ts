import { withTransaction } from '@/data/database/db.utils';
import { Logger } from '@/lib/logger';
import { type ClientSession, Types, startSession } from 'mongoose';
import LinearIssueModel, { type LinearIssue } from './linear.model';
import addToIsSeenBy from './linear.utils';

const logger = new Logger('Linear Service');

interface UpdateIssueRequestBody {
	status?: LinearIssue['status'];
	priority?: LinearIssue['priority'];
	tags?: LinearIssue['tags'];
}

class LinearService {
	private static instance: LinearService;
	constructor() {
		if (!LinearService.instance) {
			LinearService.instance = this;
		}
	}

	/*=============================================
    =         Add Reply method                =
    =============================================*/

	private convertToObjectId = (id: string): Types.ObjectId => {
		return new Types.ObjectId(id);
	};

	private pushReplyIdToIssue = async (
		issueId: string,
		replyId: string,
		userId: Types.ObjectId,
		session: ClientSession
	): Promise<void> => {
		const replyIdObj = this.convertToObjectId(replyId);
		const id = this.convertToObjectId(issueId);

		try {
			await LinearIssueModel.findByIdAndUpdate(
				id,
				{
					$push: { replies: replyIdObj },
					$set: { lastResponder: userId }
				},
				{ new: true, session }
			);
		} catch (error) {
			logger.error('Failed to update isSeen status:', error);
			throw new Error('Unable to update the issue.');
		}
	};

	/*----------  Update Reply To Issue  ----------*/
	async updateIssueWithReply(
		parentIssueId: string,
		replyId: string,
		session: ClientSession
	): Promise<void> {
		try {
			const parentIssue = await LinearIssueModel.findByIdAndUpdate(
				parentIssueId,
				{
					$set: { isReply: true },
					$push: { replies: replyId }
				},
				{ new: true, session } // Pass the session here
			).exec();

			if (!parentIssue) {
				throw new Error('Parent issue not found');
			}

			// Update the reply to reference the parent issue
		} catch (error) {
			logger.error('Failed to update issue with reply:', error);
			throw new Error('Unable to update the issue');
		}
	}

	/*----------  Change Issue Status block  ----------*/

	public async changeIssueStatus(
		id: string,
		status: string,
		session: ClientSession
	): Promise<LinearIssue> {
		logger.debug({ id: id, status: status });
		const issue = (await LinearIssueModel.findByIdAndUpdate(
			id,
			{ status: status },
			{ new: true, session }
		)) as LinearIssue;

		if (!issue) {
			throw new Error('No issue found');
		}
		return issue;
	}
	private async findIssueById(
		issueId: string
	): Promise<LinearIssue | undefined> {
		// Replace with actual DB retrieval
		const issues = await LinearIssueModel.find(
			(issue: { _id: string }) => issue._id === issueId
		);
		return issues[0];
	}

	private isCreator(issue: LinearIssue, userId: Types.ObjectId): boolean {
		return issue.assignee === userId;
	}

	public async markAsSeen(issueId: string, userId: string): Promise<void> {
		const issue = await this.findIssueById(issueId);
		if (issue) {
			addToIsSeenBy(issue, userId);
			// Persist changes to the database, replace with actual DB update call
			// this.updateIssueTwo(issue)
		}
	}

	/*=====  End of Section comment block  ======*/

	public async toggleIssueStatus(id: string): Promise<void> {
		try {
			await LinearIssueModel.findByIdAndUpdate(
				id,
				{ isSeen: false },
				{ new: true }
			);
		} catch (error) {
			logger.error('Failed to update isSeen status:', error);
			throw new Error('Unable to update the issue.');
		}
	}

	allowedFields: (keyof UpdateIssueRequestBody)[] = [
		'status',
		'priority',
		'tags'
	];

	adminResponse: (keyof UpdateIssueRequestBody)[] = [
		'status',
		'priority',
		'tags'
	];

	public filterUpdateFields(
		body: UpdateIssueRequestBody
	): Partial<UpdateIssueRequestBody> {
		const updateFields: Partial<UpdateIssueRequestBody> = {};
		for (const field of this.allowedFields) {
			if (body[field] !== undefined) {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				updateFields[field] = body[field] as any;
			}
		}
		return updateFields;
	}

	public filterAdminResponse(
		body: UpdateIssueRequestBody
	): Partial<UpdateIssueRequestBody> {
		const updateFields: Partial<UpdateIssueRequestBody> = {};
		for (const field of this.adminResponse) {
			if (body[field] !== undefined) {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				updateFields[field] = body[field] as any;
			}
		}
		return updateFields;
	}

	public static getInstance(): LinearService {
		return LinearService.instance || new LinearService();
	}

	private async getIssueById(
		id: string,
		session: ClientSession
	): Promise<LinearIssue> {
		const issue = await LinearIssueModel.findById(id)
			.session(session)
			.exec();
		if (!issue) {
			throw new Error('No issue found');
		}
		return issue;
	}

	public async withTransaction<T>(
		fn: (session: ClientSession) => Promise<T>
	): Promise<T> {
		const session: ClientSession = await startSession();
		session.startTransaction();
		try {
			const result = await fn(session);
			await session.commitTransaction();
			logger.info('Transaction committed');
			return result;
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
	}
	public async fetchAndMarkIssueAsSeen(
		issueId: string,
		userId: string
	): Promise<LinearIssue> {
		return await withTransaction(async (session) => {
			const issue = await this.getIssueById(issueId, session);
			if (!issue) {
				throw new Error('Issue not found');
			}

			// Update the issue with the user in the isSeenBy array
			addToIsSeenBy(issue, userId);

			// Save the updated issue
			await issue.save({ session });

			return issue;
		});
	}
	/*=============================================
=            Create Issue (Transaction)    =
=============================================*/
	public async createIssue(
		issue: Partial<LinearIssue>,
		userId: string
	): Promise<LinearIssue> {
		return await withTransaction(async (session) => {
			try {
				const data = new LinearIssueModel({
					assignee: new Types.ObjectId(userId),
					title: issue.title,
					description: issue.description,
					tags: issue.tags,
					status: issue.status,
					priority: issue.priority,
					isSeen: false,
					isReply: false,
					isSeenBy: [new Types.ObjectId(userId)],
					lastResponder: new Types.ObjectId(userId)
				});

				return await data.save({ session });
			} catch (error) {
				logger.error('Failed to create issue:', error);
				throw new Error('Unable to create the issue.');
			}
		});
	}

	/*----------  Add Reply  ----------*/

	public async addAdminsReply(
		issueId: string,
		description: string,
		isMine: boolean,
		userId: Types.ObjectId
	): Promise<LinearIssue> {
		try {
			return await withTransaction(async (session) => {
				const response = await this.getIssueById(issueId, session);
				if (!response) {
					throw new Error('No issue found');
				}
				const newReply = new LinearIssueModel({
					parent_ref: issueId,
					title: response.title,
					description: description,
					isReply: true,
					isSeen: false,
					assignee: response.assignee,
					priority: response.priority,
					tags: response.tags,
					status: response.status,
					isUserGenerated: !!isMine
				});
				const reply = (await newReply.save({
					session
				})) as LinearIssue;
				if (!reply) {
					throw new Error('Failed to add reply');
				}
				await this.pushReplyIdToIssue(
					issueId,
					reply._id as string,
					userId,
					session
				);
				return reply;
			});
		} catch (error) {
			logger.error('Failed to update isSeen status:', error);
			throw new Error('Unable to update the issue.');
		}
	}

	/*=============================================
=            ADD USER REPLY            =
=============================================*/

	public async addUsersReply(
		issueId: string,
		description: string,
		userId: Types.ObjectId
	): Promise<LinearIssue> {
		try {
			return await withTransaction(async (session) => {
				const issue = await this.getIssueById(issueId, session);
				if (!issue) {
					throw new Error('No issue found');
				}
				const newReply = new LinearIssueModel({
					parent_ref: issueId,
					title: issue.title,
					description: description,
					isReply: true,
					isSeen: false,
					assignee: issue.assignee,
					priority: issue.priority,
					tags: issue.tags,
					status: issue.status,
					isUserGenerated: this.isCreator(issue, userId)
				});
				const reply = await newReply.save({ session });
				if (!reply) {
					throw new Error('Failed to add reply');
				}
				await this.pushReplyIdToIssue(
					issueId,
					reply._id as string,
					userId,
					session
				);
				return reply;
			});
		} catch (error) {
			logger.error('Failed to update isSeen status:', error);
			throw new Error('Unable to update the issue.');
		}
	}
	/*----------  Add Reply  ----------*/

	public async updateIssue(
		id: string,
		body: UpdateIssueRequestBody
	): Promise<LinearIssue> {
		const updateFields = this.filterUpdateFields(body);
		const issue = (await LinearIssueModel.findByIdAndUpdate(
			id,
			updateFields,
			{
				new: true
			}
		)) as LinearIssue;

		if (!issue) {
			throw new Error('No issue found');
		}
		return issue;
	}

	public async updateAdminResponse(
		id: string,
		body: UpdateIssueRequestBody
	): Promise<LinearIssue> {
		const updateFields = this.filterAdminResponse(body);
		const issue = (await LinearIssueModel.findByIdAndUpdate(
			id,
			updateFields,
			{
				new: true
			}
		)) as LinearIssue;

		if (!issue) {
			throw new Error('No issue found');
		}
		return issue;
	}

	public async deleteIssue(id: string): Promise<void> {
		try {
			await LinearIssueModel.findByIdAndDelete(id);
		} catch (error) {
			logger.error('Failed to delete issue:', error);
			throw new Error('Unable to delete the issue.');
		}
	}

	async updateIssueById(
		issueId: string,
		userId: string,
		session: ClientSession
	): Promise<void> {
		const id = new Types.ObjectId(issueId);
		await LinearIssueModel.updateOne(
			{ _id: new Types.ObjectId(id) },
			{ $addToSet: { isSeenBy: userId } },
			{ session }
		);
	}
}

export default LinearService.getInstance();
