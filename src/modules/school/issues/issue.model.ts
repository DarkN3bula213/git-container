import { Document, Types, Schema, model } from 'mongoose';

export interface Issue extends Document {
  title: string;
  description: string;
  isSeen: boolean;
  replies: string[];
  author: Types.ObjectId;
}

const issueSchema = new Schema<Issue>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    replies: [
      {
        type: String,
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Assuming 'User' is the name of your user model
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

const IssueModel = model<Issue>('Issue', issueSchema, 'issues');

export default IssueModel;
