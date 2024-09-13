import { Socket } from 'socket.io';
import { Logger } from '@/lib/logger';
import { verifyToken } from '@/lib/utils/tokens';
import cookie from 'cookie';
import { saveSessionQueue } from '@/queues/session.queue';
import { cache } from '@/data/cache/cache.service';
import { Message, messageSingleton } from './events/messgageStore';

const logger = new Logger(__filename);
// Utility functions to handle token verification, Redis, etc.
const authenticateUser = (
  socket: Socket,
): { user: any; userID: string } | null => {
  const cookies = cookie.parse(socket.handshake.headers.cookie || '');
  const authToken = cookies.access;

  if (!authToken) {
    logger.warn(`No auth token provided, disconnecting socket ${socket.id}`);
    socket.disconnect();
    return null;
  }

  const verificationResult = verifyToken(authToken, 'access');
  if (!verificationResult.valid) {
    logger.warn(`Invalid auth token, disconnecting socket ${socket.id}`);
    socket.disconnect();
    return null;
  }

  const user = verificationResult.decoded?.user;
  const userID = user?._id;
  return { user, userID };
};

const getOrSetStartTime = async (userID: string, socket: Socket) => {
  const redisKey = `user:${userID}:startTime`;
  const startTime = await cache.get<Date>(redisKey);

  if (startTime) {
    socket.data.startTime = new Date(startTime);
    logger.info(
      `Reusing startTime from Redis for user ${userID} on socket ${socket.id}`,
    );
  } else {
    const newStartTime = new Date();
    socket.data.startTime = newStartTime;
    await cache.set(redisKey, newStartTime.toISOString());
    logger.info(
      `Set new startTime in Redis for user ${userID} on socket ${socket.id}`,
    );
  }
};

const handleDelayedJobs = async (userID: string) => {
  const jobId = `job-${userID}`;
  const delayedJobs = await saveSessionQueue.getDelayed();
  const job = delayedJobs.find((job) => job.id === jobId);

  if (job) {
    await job.remove();
    logger.info(`Removed delayed job for user ${userID} as they reconnected`);
  }
};

// Handle user connection and prevent duplicate sessions
const manageUserConnection = (
  socket: Socket,
  connectedUsers: Map<
    string,
    { userId: string; username: string; socketId: string }
  >,
) => {
  const userId = socket.data.userId as string;
  const username = socket.handshake.query.username as string;

  if (connectedUsers.has(userId)) {
    const existingUser = connectedUsers.get(userId);
    if (existingUser) {
      logger.info(
        `User ${username} (ID: ${userId}) already connected. Disconnecting previous session: ${existingUser.socketId}`,
      );
      const previousSocket = socket.nsp.sockets.get(existingUser.socketId);
      if (previousSocket) previousSocket.disconnect();
    }
  }

  connectedUsers.set(userId, {
    userId,
    username,
    socketId: socket.id,
  });

  logger.debug({
    id: userId,
    username: username,
    socketId: socket.id,
  });

  return username;
};

// Handle message sending and receiving
const handleMessageEvents = (
  socket: Socket,
  connectedUsers: Map<string, any>,
) => {
  socket.on('privateMessage', async ({ toUserId, message }) => {
    const userId = socket.data.userId;
    const username = socket.data.username;
    const recipient = connectedUsers.get(toUserId);

    if (recipient) {
      const newMessage = {
        from: { userId, username, socketId: socket.id },
        to: recipient,
        content: message,
        timestamp: Date.now(),
      } as Message;

      await messageSingleton.saveMessage(newMessage);

      socket.to(recipient.socketId).emit('messageReceived', {
        from: { userId, username, socketId: socket.id },
        to: {
          userId: recipient.userId,
          username: recipient.username,
          socketId: recipient.socketId,
        },
        message,
        timestamp: new Date().toISOString(),
      });
      logger.info(
        `Message sent to user ID: ${toUserId} (socket ID: ${recipient.socketId})`,
      );
    } else {
      logger.warn(
        `Recipient with user ID: ${toUserId} not found or disconnected`,
      );
      socket.emit('messageError', {
        message: 'User not found or disconnected',
      });
    }
  });
};

const rooms: { [id: string]: string[] } = {};

const handleJoinRoom = (socket: Socket, roomId: string) => {
  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].push(socket.id);
    } else {
      rooms[roomId] = [socket.id];
    }
    const otherUser = rooms[roomId].find((id) => id !== socket.id);
    if (otherUser) {
      socket.emit('other user', otherUser);
      socket.to(otherUser).emit('user joined', socket.id);
    }
  });
};

const handleOffer = (socket: Socket) => {
  socket.on('offer', (payload) => {
    socket.to(payload.target).emit('offer', payload);
  });
};

const handleAnswer = (socket: Socket) => {
  socket.on('answer', (payload) => {
    socket.to(payload.target).emit('answer', payload);
  });
};

const handleCandidate = (socket: Socket) => {
  socket.on('candidate', (payload) => {
    socket.to(payload.target).emit('candidate', payload);
  });
};
export {
  authenticateUser,
  getOrSetStartTime,
  handleDelayedJobs,
  manageUserConnection,
  handleMessageEvents,
  handleJoinRoom,
  handleOffer,
  handleAnswer,
  handleCandidate,
};
