import { Document, Types, Schema, model } from 'mongoose';

export interface Reply {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  message: string;
  createdAt: Date;
  isFresh: boolean;  
}

export interface Issue extends Document {
  title: string;
  description: string;
  isSeen: boolean; // Considering for removal or repurpose
  replies: Reply[];
  author: Types.ObjectId;
  addressedTo?: Types.ObjectId; // Optional, to specify if a message is targeted
}

const replySchema = new Schema<Reply>({
  author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isFresh: { type: Boolean, default: true },
});

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
    replies: [replySchema],
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    addressedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Optional
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

const IssueModel = model<Issue>('Issue', issueSchema);

export default IssueModel;
