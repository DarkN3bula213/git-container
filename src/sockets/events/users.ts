import { Logger } from '@/lib/logger';
import { ConnectedUser } from '@/types/connectedUsers';
import { Socket } from 'socket.io';
import { sendAdminMessage } from '../utils/emitMessage';
import {
	broadcastUserList,
	joinUserRoom,
	updateUserSocket
} from './socket.events';

const logger = new Logger(__filename);

// Main handler function for user events
export const handleUsers = (
	socket: Socket,
	connectedUsers: Map<string, ConnectedUser>
) => {
	const userId = socket.data.userId as string;
	const username = socket.data.username as string;
	const sessionId = socket.data.sessionId as string;

	if (!userId || !username || !sessionId) {
		logger.error('User not authenticated, cannot manage connection.');
		return;
	}

	// Initial setup
	handleExistingConnection(connectedUsers, sessionId, socket);
};

// Utility Functions
const handleExistingConnection = (
	connectedUsers: Map<string, ConnectedUser>,
	sessionId: string,
	socket: Socket
) => {
	const newSocketId = socket.id;
	const username = socket.data.username as string;
	const userId = socket.data.userId as string;

	/*<-1. Update user socket ---------------------------------*/
	updateUserSocket(connectedUsers, sessionId, newSocketId);

	/*<-2. Join user room ---------------------------------*/
	joinUserRoom(socket);

	/*<-3. Set user list ---------------------------------*/
	connectedUsers.set(sessionId, {
		userId,
		username,
		socketId: socket.id,
		isAvailable: false // Default to available
	});

	/*<-4. Broadcast user list ---------------------------------*/
	broadcastUserList(socket, connectedUsers);

	/*<-5. Send admin message ---------------------------------*/
	sendAdminMessage(socket, connectedUsers, `${username} connected`);
};
