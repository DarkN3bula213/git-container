import {
	type Document,
	type InferSchemaType,
	Schema,
	type Types,
	model
} from 'mongoose';

export interface Attachment {
	url: string;
	filename: string;
	filetype: string;
}
export interface LinearIssue extends Document {
	assignee: Types.ObjectId;
	title: string;
	description: string;
	status: 'backlog' | 'inProgress' | 'inReview' | 'done' | 'canceled';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	tags?: string[];
	attachments?: Attachment[];
	isArchived: boolean;
	isSeen: boolean;
	isReply: boolean;
	timeEstimate: number | string | Date;
	txId: string;
	parent_ref?: Types.ObjectId;
	replies?: LinearIssue[];
	isSeenBy?: Types.ObjectId[];
	isUserGenerated: boolean;
	lastResponder: Types.ObjectId;
	isOpen?: boolean;
	isResolved?: boolean;
}

const issueSchema = new Schema<LinearIssue>(
	{
		replies: [{ type: Schema.Types.ObjectId, ref: 'LinearIssue' }],
		txId: { type: String, unique: false },
		assignee: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		},
		parent_ref: { type: Schema.Types.ObjectId, ref: 'LinearIssue' },
		title: { type: String, required: true },
		description: { type: String, required: true },
		status: {
			type: String,
			enum: ['backlog', 'inProgress', 'inReview', 'done', 'canceled'],
			default: 'backlog'
		},
		priority: {
			type: String,
			enum: ['low', 'medium', 'high', 'urgent'],
			default: 'medium'
		},
		tags: [{ type: String }],
		attachments: [{ type: Schema.Types.Mixed }],
		isArchived: { type: Boolean, default: false },
		isSeen: { type: Boolean, default: false },
		isReply: { type: Boolean, default: false },
		timeEstimate: { type: Schema.Types.Mixed },
		isSeenBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
		isUserGenerated: { type: Boolean, default: true },
		lastResponder: { type: Schema.Types.ObjectId, ref: 'User' },
		isOpen: { type: Boolean, default: true },
		isResolved: { type: Boolean, default: false }
	},
	{
		timestamps: true
	}
);

issueSchema.virtual('rep', {
	ref: 'LinearIssue', // The model to use
	localField: '_id', // Find in _id of local document
	foreignField: 'parent_ref' // is equal to parent_ref in foreign document
});

interface TicketSeq {
	_id: string;
	seq: number;
}

const ticketSeq = new Schema<TicketSeq>({
	_id: String, // Use a string like '2023-06-23' as the ID
	seq: {
		type: Number,
		default: 0
	}
});

const Sequence = model<TicketSeq>('Sequence', ticketSeq);

async function generateTicketNumber(): Promise<string> {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const date = now.getDate();
	const id = `${year}-${month}-${date}`;

	const quarterLetter = ['A', 'E', 'P', 'X'][Math.floor(date / 8) % 4];
	const monthLetter = String.fromCharCode(
		64 + (month === 7 ? month + 1 : month)
	);
	const dayUnit = date % 10;

	const sequenceDoc = await Sequence.findByIdAndUpdate(
		id,
		{ $inc: { seq: 1 } },
		{ new: true, upsert: true }
	);

	return `${quarterLetter}${dayUnit}-${monthLetter}${String(sequenceDoc.seq).padStart(2, '0')}`;
}

issueSchema.pre('save', async function (next) {
	if (!this.txId) {
		this.txId = await generateTicketNumber();
	}
	next();
});

export type IssueDoc = InferSchemaType<typeof issueSchema>;

export const LinearIssueModel = model<IssueDoc>('LinearIssue', issueSchema);

export default LinearIssueModel;
