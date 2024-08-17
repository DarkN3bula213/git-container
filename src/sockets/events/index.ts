import { Logger } from '@/lib/logger';
import { calculateTimeSpent } from '../socket.utils';
import { type Socket } from 'socket.io';
const logger = new Logger(__filename);
import cookie from 'cookie';
import { saveSessionQueue } from '@/queues/session.queue';
import { verifyToken } from '@/lib/utils/tokens';
export const handleDisconnect = async (socket: Socket) => {
  const userID = socket.data.userId;
  logger.info(`User ${userID} is disconnecting...`);

  const session = calculateTimeSpent(socket.data.startTime);

  logger.info(`Session calculated for user ${userID}:`, session);

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

  logger.info(`Job ${job.id} queued for user ${userID}`);

  socket.disconnect();
  logger.info(`User ${userID} disconnected`);
};

export const handleConnect = async (socket: Socket) => {
  const cookies = cookie.parse(socket.handshake.headers.cookie || '');
  const authToken = cookies.access;
  if (!authToken) {
    socket.disconnect();
    return;
  }

  const verificationResult = verifyToken(authToken, 'access');
  if (!verificationResult.valid) {
    logger.warn('Invalid auth token from cookies, disconnecting socket.');
    socket.disconnect();
    return;
  }
  logger.info(`User ${verificationResult.decoded?.user.name} connected`);

  const userID = verificationResult.decoded?.user._id;
  socket.data.userId = userID;
  socket.data.startTime = new Date();
  const jobId = `job-${userID}`;

  const delayedJobs = await saveSessionQueue.getDelayed();
  const job = delayedJobs.find((job) => job.id === jobId);

  if (job) {
    await job.remove();
    logger.info(`Removed delayed job for user ${userID} as they reconnected.`);
  }
};
