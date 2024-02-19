import { Document, Types, Schema, model } from 'mongoose';

export interface Issue extends Document {
  title: string;
  description: string;

  replies: [{ type: Schema.Types.ObjectId; ref: 'Reply' }];
  author: Types.ObjectId;
  seenBy: [{ type: Schema.Types.ObjectId; ref: 'User' }];
  creator: {
    _id: {
      type: Types.ObjectId;
      ref: 'User';
    };
    name: {
      type: String;
      ref: 'User';
    };
    email: {
      type: String;
      ref: 'User';
    };
  };
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

    seenBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }],
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Assuming 'User' is the name of your user model
    },
    creator: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String,
        ref: 'User',
      },
      email: {
        type: String,
        ref: 'User',
      },
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

const IssueModel = model<Issue>('Issue', issueSchema, 'issues');

export default IssueModel;

 
const replySchema = new Schema<IReply>({
  content: { type: String, required: true },
  creator: {
    type:  Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  issue: { type:  Schema.Types.ObjectId, ref: 'Issue', required: true },
  readBy: [{ type:  Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

 
 

interface IReply extends Document {
  content: string;
  creator: Schema.Types.ObjectId;
  issue: Schema.Types.ObjectId;
  readBy: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const Issues= model<Issue>('Issue', issueSchema);
const Reply = model<IReply>('Reply', replySchema);

export { Issues, Reply };