import { Logger } from '@/lib/logger';
import { ConnectedUser } from '@/types/connectedUsers';
import { Socket } from 'socket.io';
import { sendAdminMessage } from '../utils/emitMessage';
import { getOnlineUsers } from '../utils/getOnlineUsers';

const logger = new Logger(__filename);

// Main handler function for user events
export const handleUsers = async (
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

	logger.info(`Managing connection for user ${username} (${userId})`);

	// Initial setup
	handleExistingConnection(connectedUsers, sessionId, socket.id);
	joinUserRoom(socket);

	// Add/update the user in connectedUsers map
	connectedUsers.set(sessionId, {
		userId,
		username,
		socketId: socket.id,
		isAvailable: false // Default to available
	});

	// Set up event listeners
	socket.on(
		'setAvailability',
		handleSetAvailability(socket, connectedUsers, sessionId)
	);

	// Initial broadcasts
	broadcastUserList(socket, connectedUsers);
	sendAdminMessage(socket, connectedUsers, `${username} connected`);
};

// Handle user availability changes
// Event Handlers
export const handleSetAvailability =
	(
		socket: Socket,
		connectedUsers: Map<string, ConnectedUser>,
		sessionId: string
	) =>
	(isAvailable: boolean) => {
		const user = connectedUsers.get(sessionId);
		if (user) {
			// Only update if availability actually changed
			user.isAvailable = isAvailable;
			connectedUsers.set(sessionId, user);
			broadcastUserList(socket, connectedUsers);

			logger.info(
				`User ${user.username} (${user.userId}) availability changed to ${isAvailable}`
			);
		}
	};

// Utility Functions
const handleExistingConnection = (
	connectedUsers: Map<string, ConnectedUser>,
	sessionId: string,
	newSocketId: string
) => {
	if (connectedUsers.has(sessionId)) {
		const existingUser = connectedUsers.get(sessionId);
		if (existingUser && existingUser.socketId !== newSocketId) {
			connectedUsers.delete(sessionId);
			logger.warn(
				`Disconnecting duplicate connection for user with socketId ${existingUser.socketId}`
			);
		}
	}
};

const joinUserRoom = (socket: Socket) => {
	const userId = socket.data.userId as string;
	if (userId) {
		socket.join(userId);
	} else {
		logger.warn(
			`Unable to join user room: userId not found in socket.data`
		);
	}
};

export const broadcastUserList = (
	socket: Socket,
	connectedUsers: Map<string, ConnectedUser>
) => {
	const onlineUsers = getOnlineUsers(connectedUsers);

	socket.broadcast.emit('userListUpdated', onlineUsers);
};
