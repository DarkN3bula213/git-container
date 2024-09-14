import { Logger } from '@/lib/logger';
import { Socket } from 'socket.io';
import events from '@/lib/constants/socket-events';
import { User } from '@/modules/auth/users/user.model';

const logger = new Logger(__filename);

interface IRoomParams {
   roomId: string;
   userId: string;
}

const rooms: Record<string, Record<string, Partial<User>>> = {};
const chats: Record<string, IMessage[]> = {};

interface IJoinRoomParams extends IRoomParams {
   userName: string;
}

interface IMessage {
   content: string;
   author?: string;
   timestamp: number;
}

export const handleRooms = (socket: Socket) => {
   const user = socket.data.user;
   const socketId = socket.id;

   const logAndEmit = (event: string, data: any) => {
      logger.debug(`Event: ${event}, Data: ${JSON.stringify(data)}`);
      socket.emit(event, data);
   };

   const createRoom = () => {
      const roomId = 'opt-in-chat';
      if (!rooms[roomId]) {
         rooms[roomId] = {};
         logger.info(`Room ${roomId} created by socket ${socketId}`);
      }

      socket.join(roomId);
      logAndEmit(events.room_created, { roomId, currentUser: user });
   };

   const joinRoom = ({ roomId, userId, userName }: IJoinRoomParams) => {
      if (!rooms[roomId]) rooms[roomId] = {};
      if (!chats[roomId]) chats[roomId] = [];

      rooms[roomId][userId] = { _id: userId, username: userName };
      socket.join(roomId);

      logger.info(`User ${userName} (${userId}) joined room ${roomId}`);

      logAndEmit(events.get_messages, chats[roomId]);
      logAndEmit(events.get_users, {
         roomId,
         participants: rooms[roomId]
      });
      socket.to(roomId).emit(events.users_joined, {
         userId,
         userName
      });

      notifyRoomStatus(roomId, true);

      socket.on('disconnect', () => {
         logger.info(
            `User ${userName} (${userId}) disconnected from room ${roomId}`
         );
         leaveRoom({ roomId, userId });
      });
   };

   const leaveRoom = ({ roomId, userId }: IRoomParams) => {
      socket.leave(roomId);
      delete rooms[roomId][userId];
      logger.info(`User ${userId} left room ${roomId}`);
      socket.to(roomId).emit(events.user_disconnected, { userId });

      notifyRoomStatus(roomId, false);
   };

   const startSharing = ({ roomId, userId }: IRoomParams) => {
      logger.info(`User ${userId} started sharing in room ${roomId}`);
      socket.to(roomId).emit(events.start_sharing, { userId });
   };

   const stopSharing = ({ roomId, userId }: IRoomParams) => {
      logger.info(`User ${userId} stopped sharing in room ${roomId}`);
      socket.to(roomId).emit(events.stop_sharing, { userId });
   };

   const addMessage = (roomId: string, message: IMessage) => {
      if (!chats[roomId]) chats[roomId] = [];

      // Validate that the message has necessary fields
      if (!message.content || !message.timestamp || !message.author) {
         logger.warn('Invalid message structure received.');
         return;
      }

      // Add the message to the chat history
      chats[roomId].push(message);

      logger.info(`Message added to room ${roomId} by ${message.author}`);

      // Broadcast the message to all users in the room, including the sender
      socket.to(roomId).emit(events.get_messages, message);
      socket.emit(events.get_messages, message); // Also send the message back to the sender
   };

   const changeName = ({ roomId, userId, userName }: IJoinRoomParams) => {
      if (rooms[roomId] && rooms[roomId][userId]) {
         rooms[roomId][userId].username = userName;
         logger.info(
            `User ${userId} changed name to ${userName} in room ${roomId}`
         );

         socket.to(roomId).emit(events.name_changed, {
            userId,
            userName
         });
      }
   };

   const notifyRoomStatus = (roomId: string, isInRoom: boolean) => {
      logAndEmit(events.room_status, { roomId, isInRoom });
   };

   // Registering event handlers
   socket.on(events.create_room, createRoom);
   socket.on(events.join_room, joinRoom);
   socket.on(events.leave_room, leaveRoom);
   socket.on(events.start_sharing, startSharing);
   socket.on(events.stop_sharing, stopSharing);
   socket.on(events.send_message, addMessage);
   socket.on(events.change_name, changeName);
};
