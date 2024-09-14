import { Logger } from '@/lib/logger';
import { Server, type Socket } from 'socket.io';
import cookie from 'cookie';
import { saveSessionQueue } from '@/queues/session.queue';
import { verifyToken } from '@/lib/utils/tokens';
import { cache } from '@/data/cache/cache.service';
import { Message, messageSingleton } from './messgageStore';

import {
  authenticateUser,
  getOrSetStartTime,
  handleDelayedJobs,
  manageUserConnection,
  handleMessageEvents,
} from '../socket.events';
import { removeSaveSessionJob } from '../session.processor';

const logger = new Logger(__filename);

// Main connection handler
export const handleConnect = async (
  socket: Socket,
  io: Server,
  connectedUsers: Map<
    string,
    { userId: string; username: string; socketId: string }
  >,
) => {
  logger.info(`Handling connection for socket ${socket.id}`);

  const authResult = authenticateUser(socket);
  if (!authResult) return;

  const { user, userID } = authResult;
  socket.data.user = user;
  socket.data.userId = userID;
  const username = manageUserConnection(socket, connectedUsers, io);
  await removeSaveSessionJob(userID);

  const users = Array.from(connectedUsers.values());
  socket.broadcast.emit('userListUpdated', users);
  socket.emit('currentUser', connectedUsers.get(userID));
  io.emit('systemMessage', {
    message: `${username} has joined the chat`,
    timestamp: new Date().toISOString(),
  });

  // Handle messages
  handleMessageEvents(socket, connectedUsers);
};
