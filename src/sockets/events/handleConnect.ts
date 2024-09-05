import { Logger } from '@/lib/logger';
import { type Socket } from 'socket.io';
const logger = new Logger(__filename);
import cookie from 'cookie';
import { saveSessionQueue } from '@/queues/session.queue';
import { verifyToken } from '@/lib/utils/tokens';
import { cache } from '@/data/cache/cache.service';

export const handleConnect = async (socket: Socket) => {
  logger.info(`Handling connection for socket ${socket.id}`);

  const cookies = cookie.parse(socket.handshake.headers.cookie || '');
  const authToken = cookies.access;

  if (!authToken) {
    logger.warn(`No auth token provided, disconnecting socket ${socket.id}`);
    socket.disconnect();
    return;
  }

  const verificationResult = verifyToken(authToken, 'access');
  if (!verificationResult.valid) {
    logger.warn(`Invalid auth token, disconnecting socket ${socket.id}`);
    socket.disconnect();
    return;
  }
  const user = verificationResult.decoded?.user;
  const userID = verificationResult.decoded?.user._id;
  const redisKey = `user:${userID}:startTime`;

  // Check if startTime is already set in Redis using CacheClientService
  const startTime = await cache.get<Date>(redisKey);

  if (startTime) {
    // If there's an existing startTime, use it
    socket.data.startTime = new Date(startTime);
    logger.info(
      `Reusing startTime from Redis for user ${userID} on socket ${socket.id}: ${socket.data.startTime}`,
    );
  } else {
    // If not, set a new startTime and cache it
    const newStartTime = new Date();
    socket.data.startTime = newStartTime;
    await cache.set(redisKey, newStartTime.toISOString());
    logger.info(
      `Set new startTime in Redis for user ${userID} on socket ${socket.id}: ${socket.data.startTime}`,
    );
  }
  socket.data.user = user;
  socket.data.userId = userID;

  // Handle any delayed jobs
  const jobId = `job-${userID}`;
  const delayedJobs = await saveSessionQueue.getDelayed();
  const job = delayedJobs.find((job) => job.id === jobId);

  if (job) {
    await job.remove();
    logger.info(
      `Removed delayed job for user ${userID} as they reconnected on socket ${socket.id}`,
    );
  }
};
