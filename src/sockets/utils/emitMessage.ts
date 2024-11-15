import { ConnectedUser } from '@/types/connectedUsers';
import { Server, Socket } from 'socket.io';

export const emitMessage = (
	io: Server,
	{
		receivers,
		event,
		payload
	}: {
		receivers: string[];
		event: string;
		payload: object;
	}
) => {
	receivers.forEach((receiverId) => {
		io.to(receiverId).emit(event, payload);
	});
};

export const getSocketIdByUserId = (
	connectedUsers: Map<string, ConnectedUser>,
	userId: string
): string | undefined => {
	for (const [, user] of connectedUsers) {
		if (user.userId === userId) {
			return user.socketId;
		}
	}
	return undefined;
};

export const sendAdminMessage = (
	socket: Socket,
	connectedUsers: Map<string, ConnectedUser>,
	message: string,
	excludeUserId?: string
) => {
	// Iterate over connected users
	connectedUsers.forEach((user) => {
		if (user.isAdmin && user.userId !== excludeUserId) {
			// Send 'adminMessage' to the admin user's socket
			socket.to(user.socketId).emit('adminMessage', {
				message,
				timestamp: new Date().toISOString()
			});
		}
	});
};
