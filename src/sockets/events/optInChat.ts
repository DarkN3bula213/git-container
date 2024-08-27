import { Logger } from '@/lib/logger';
import { type Socket } from 'socket.io';
import { cache } from '@/data/cache/cache.service';

const logger = new Logger(__filename);

export const handleChatOptIn = async (socket: Socket) => {
  const userId = socket.data.userId;

  if (!userId) {
    logger.warn(`No user ID found in socket data for socket ${socket.id}`);
    socket.disconnect();
    return;
  }

  // Store the user's chat opt-in status in Redis
  const chatOptInKey = `user:${userId}:chatOptIn`;
  await cache.set(chatOptInKey, true);

  // Join the user to a chat room (e.g., based on user ID or a general chat room)
  socket.join(`chat:${userId}`);

  logger.info(`User ${userId} opted into chat on socket ${socket.id}`);
  socket.emit('chat-opt-in-success', {
    message: 'Successfully opted into chat',
  });
};
