import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import { User } from '../users/user.model';

export interface SessionDocument extends mongoose.Document {
  user: User['_id'];
  valid: boolean;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    valid: { type: Boolean, default: true },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  },
);

const SessionModel = mongoose.model<SessionDocument>('Session', sessionSchema);

export default SessionModel;

export async function createSession(userId: string, userAgent: string) {
  const session = await SessionModel.create({ user: userId, userAgent });

  return session.toJSON();
}

export async function findSessions(query: FilterQuery<SessionDocument>) {
  return SessionModel.find(query).lean();
}

export async function updateSession(
  query: FilterQuery<SessionDocument>,
  update: UpdateQuery<SessionDocument>,
) {
  return SessionModel.updateOne(query, update);
}
