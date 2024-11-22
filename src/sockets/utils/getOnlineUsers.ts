import { ConnectedUser } from '@/types/connectedUsers';

export const getOnlineUsers = (
	connectedUsers: Map<string, ConnectedUser>,
	excludeUserId?: string
): ConnectedUser[] => {
	return Array.from(connectedUsers.values())
		.filter(
			(user) =>
				user.isAvailable &&
				// Optionally exclude a specific user (like the current user)
				(excludeUserId ? user.userId !== excludeUserId : true)
		)
		.map(({ socketId, userId, username, isAvailable }) => ({
			socketId,
			userId,
			username,
			isAvailable
		}));
};
