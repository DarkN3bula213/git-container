import { Logger } from '@/lib/logger';
import { type Document, InferSchemaType, Schema, model } from 'mongoose';
import { cache } from '@/data/cache/cache.service';
const logger = new Logger('__filename');
import { parseISO } from 'date-fns'; // Import date-fns parseISO
import { convertToMilliseconds } from '@/lib/utils/fns';

import { calculateTimeSpent } from './socket.utils';

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
    lastLoggedIn: { type: Date, default: Date.now }
});

type UserSessionModelType = InferSchemaType<typeof UserSessionSchema>;
const UserSessionModel = model<UserSessionModelType>(
    'UserSession',
    UserSessionSchema
);

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
    timeSpent: string
) => {
    try {
        // Assume session creation involves database operations
        const session = new UserSessionModel({
            userID,
            startTime,
            endTime,
            timeSpent
        });
        await session.save();
    } catch (error: any) {
        logger.error(
            `Error saving session for user ${userID}: ${error.message}`
        );
        throw error; // Important to rethrow the error to ensure Bull understands the job failed
    }
};

const SESSION_TTL = convertToMilliseconds('1m'); // Set the session to expire in Redis after 24 hours

// Start a session in Redis
export async function startUserSession(userID: string) {
    logger.info(`Starting user session for userID: ${userID}`);
    const startTime = new Date();
    logger.debug(`Session start time: ${startTime.toISOString()}`);

    try {
        await cache.setExp(
            `user:${userID}:startTime`,
            startTime.toISOString(),
            SESSION_TTL
        );
        logger.info(
            `Successfully set session start time in cache for userID: ${userID}`
        );
    } catch (error) {
        logger.error(
            `Failed to set session start time in cache for userID: ${userID}. Error: ${error}`
        );
        throw error;
    }

    logger.info(`User session started successfully for userID: ${userID}`);
    return startTime;
}
// End a session in Redis and persist to MongoDB
export async function endUserSession(userID: string) {
    logger.info(`Ending user session for user ${userID}`);
    const startTimeStr = String(await cache.get(`user:${userID}:startTime`));
    if (!startTimeStr) {
        logger.warn(`No start time found for user ${userID}`);
        return;
    }

    logger.debug(`Retrieved start time for user ${userID}: ${startTimeStr}`);
    const startTime = parseISO(startTimeStr);
    const endTime = new Date();
    const timeSpent = calculateTimeSpent(startTime);
    logger.info(`Session duration for user ${userID}: ${timeSpent}`);

    // Save the session to MongoDB
    logger.debug(`Creating UserSessionModel for user ${userID}`);
    const userSession = new UserSessionModel({
        userID,
        startTime: timeSpent.startTime,
        endTime: timeSpent.endTime,
        timeSpent: timeSpent.time
    });

    try {
        await userSession.save();
        logger.info(`Session saved to MongoDB for user ${userID}`);
    } catch (error) {
        logger.error(
            `Error saving session to MongoDB for user ${userID}: ${error}`
        );
        throw error;
    }

    // Optionally delete the session key from Redis
    try {
        await cache.del(`user:${userID}:startTime`);
        logger.debug(`Deleted start time from Redis for user ${userID}`);
    } catch (error) {
        logger.warn(
            `Failed to delete start time from Redis for user ${userID}: ${error}`
        );
    }

    logger.info(`Session ended successfully for user ${userID}`);
    return { startTime, endTime, timeSpent };
}

// Check for an active session in Redis
export async function getSessionStatus(userID: string) {
    const startTime = await cache.get(`user:${userID}:startTime`);
    return !!startTime;
}
