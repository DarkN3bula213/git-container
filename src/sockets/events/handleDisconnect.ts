import { Logger } from '@/lib/logger';
import { calculateTimeSpent } from '../socket.utils';
import { type Socket } from 'socket.io';
import { saveSessionQueue } from '@/queues/session.queue';
import { cache } from '@/data/cache/cache.service';
const logger = new Logger(__filename);

export const handleDisconnect = async (socket: Socket) => {
  const userID = socket.data.userId;
  const redisKey = `user:${userID}:startTime`;
  const userId = socket.data.userId;

  if (userId) {
    // Remove the user's chat opt-in status from the cache
    const chatOptInKey = `user:${userId}:chatOptIn`;
    await cache.del(chatOptInKey);

    logger.info(
      `User ${userId} disconnected from socket ${socket.id}, cache cleared`,
    );
  } else {
    logger.warn(`No user ID found for disconnected socket ${socket.id}`);
  }
  // Retrieve the startTime from Redis using CacheClientService
  const cachedStartTime = await cache.get<Date>(redisKey);

  if (!cachedStartTime) {
    logger.error(
      `startTime is missing in Redis for user ${userID} on socket ${socket.id}. Cannot calculate session time.`,
    );
    return;
  }

  let session;
  try {
    session = calculateTimeSpent(new Date(cachedStartTime));
  } catch (error: any) {
    logger.error(
      `Error calculating time spent for user ${userID} on socket ${socket.id}: ${error.message}`,
    );
    return;
  }

  logger.info(
    `Session calculated for user ${userID} on socket ${socket.id}: ${JSON.stringify(session)}`,
  );

  try {
    const job = await saveSessionQueue.add(
      'saveUserSession',
      {
        userID,
        startTime: session.startTime,
        endTime: session.endTime,
        time: session.time,
      },
      {
        jobId: `job-${userID}`,
        delay: 5 * 60 * 1000, // 5-minute delay
      },
    );

    logger.info(
      `Job ${job.id} queued for user ${userID} on socket ${socket.id}`,
    );
  } catch (error: any) {
    logger.error(
      `Failed to add job for user ${userID} on socket ${socket.id}: ${error.message}`,
    );
  }

  // Clean up Redis key after job is queued
  await cache.del(redisKey);

  socket.disconnect();
};
