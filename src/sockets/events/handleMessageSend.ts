import { Logger } from '@/lib/logger';
import { type Socket } from 'socket.io';
import { cache } from '@/data/cache/cache.service';

const logger = new Logger(__filename);

export const handleMessageSend = async (socket: Socket, messageData: any) => {
  const userId = socket.data.userId;

  if (!userId) {
    logger.warn(`No user ID found in socket data for socket ${socket.id}`);
    socket.disconnect();
    return;
  }

  const { recipientId, message } = messageData;

  // Validate message structure
  if (!recipientId || !message) {
    logger.warn(
      `Invalid message data from user ${userId} on socket ${socket.id}`,
    );
    return;
  }

  // Broadcast the message to the recipient's chat room
  socket.to(`chat:${recipientId}`).emit('receive-message', {
    senderId: userId,
    message: message,
    timestamp: new Date().toISOString(),
  });

  logger.info(
    `User ${userId} sent a message to ${recipientId} on socket ${socket.id}`,
  );
};
