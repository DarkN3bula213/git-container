import { Document, model, Schema } from 'mongoose';

export interface UserSession extends Document {
  userID: string;
  startTime: Date;
  endTime: Date;
  timeSpent: string;
}

const UserSessionSchema: Schema = new Schema({
  userID: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  timeSpent: { type: String, required: true },
});

const UserSessionModel = model<UserSession>('UserSession', UserSessionSchema);

export default UserSessionModel;
