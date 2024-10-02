import { Document, Schema, Types, model } from 'mongoose';


export interface IReply extends Document {
	issue: Types.ObjectId;
	author: Types.ObjectId;
	content: string;
	seenBy: Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

const ReplySchema: Schema = new Schema(
	{
		issue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
		author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		content: { type: String, required: true },
		seenBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
	},
	{ timestamps: true }
);

export interface IIssue extends Document {
	title: string;
	priority: string;
	reference?: string;
	label?: string;
	description: string;
	attachment?: any;
	author: Types.ObjectId;
	seenBy: Types.ObjectId[];
	replies: Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}
 

const issueSchema = new Schema<IIssue>(
	{
		title: { type: String, required: true, minlength: 3 },
		priority: { type: String, required: true },
		reference: { type: String },
		label: { type: String },
		description: { type: String, required: true, minlength: 10 },
		attachment: { type: Schema.Types.Mixed },
		author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		seenBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
		replies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }]
	},
	{ timestamps: true }
);

const IssueModel = model<IIssue>('Issue', issueSchema);

export default IssueModel;

export const Reply = model<IReply>('Reply', ReplySchema);