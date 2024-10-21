import { Server } from 'socket.io';

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
	connectedUsers: Map<
		string,
		{ userId: string; username: string; socketId: string }
	>,
	userId: string
): string | undefined => {
	for (const [, user] of connectedUsers) {
		if (user.userId === userId) {
			return user.socketId;
		}
	}
	return undefined;
};
