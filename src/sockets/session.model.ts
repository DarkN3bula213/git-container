import { Logger } from '@/lib/logger';
import { type Document, Schema, model } from 'mongoose';
const logger = new Logger(__filename);

export interface UserSession extends Document {
  userID: string;
  startTime: Date;
  endTime: Date;
  timeSpent: string;
  lastLoggedIn?: Date;
}

const UserSessionSchema: Schema = new Schema<UserSession>({
  userID: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  timeSpent: { type: String, required: true },
  lastLoggedIn: { type: Date, default: Date.now },
});

const UserSessionModel = model<UserSession>('UserSession', UserSessionSchema);

export default UserSessionModel;

// Stand alone async functions

export const getUserSessions = async (userID: string) => {
  return await UserSessionModel.find({ userID: userID });
};

export const deleteUserSessions = async (userID: string) => {
  return await UserSessionModel.deleteMany({ userID: userID });
};

export const getSessions = async () => {
  return await UserSessionModel.find();
};

export const createUserSession = async (
  userID: string,
  startTime: Date,
  endTime: Date,
  timeSpent: string,
) => {
  try {
    // Assume session creation involves database operations
    const session = new UserSessionModel({
      userID,
      startTime,
      endTime,
      timeSpent,
    });
    await session.save();
    logger.info(`Session saved for user ${userID}`);
  } catch (error: any) {
    logger.error(`Error saving session for user ${userID}: ${error.message}`);
    throw error; // Important to rethrow the error to ensure Bull understands the job failed
  }
};
