import { Logger } from '@/lib/logger';
import { verifyToken } from '@/lib/utils/tokens';
import { isUserAdmin } from '@/modules/auth/users/user.model';
import cookie from 'cookie';
import { Server, Socket } from 'socket.io';
import { v4 } from 'uuid';
import { DefaultSocketEvents } from '.';
import { sessionStore } from '../store/session-store';
import { getOrSetStartTime } from '../utils/getStartTimeFromCache';

const logger = new Logger(__filename);

export const handleAuth = async (
	socket: Socket,
	io: Server
): Promise<boolean> => {
	const cookies = cookie.parse(socket.handshake.headers.cookie ?? '');
	const authToken = cookies.access;

	if (!authToken) {
		logger.warn(
			`Disconnecting socket ${socket.id.substring(0, 4)} due to no auth token`
		);
		socket.emit('logout');
		socket.disconnect();
		return false;
	}

	const verificationResult = verifyToken(authToken, 'access');
	if (!verificationResult.valid) {
		logger.warn(
			`Disconnecting socket ${socket.id.substring(0, 4)} due to invalid auth token`
		);
		socket.emit('logout');
		socket.disconnect();
		return false;
	}

	const user = verificationResult.decoded?.user;
	const userId = user?._id;
	const username = user?.username;

	if (!userId || !username) {
		logger.warn(
			`Disconnecting socket ${socket.id.substring(0, 4)} due to invalid user data`
		);
		socket.disconnect();
		return false;
	}

	await getOrSetStartTime(userId.toString(), socket);

	const sessionId = await handleSession(socket, userId.toString(), username);
	const isAdmin = await isUserAdmin(userId);
	// logger.info(`${username} is: ${isAdmin ? 'admin' : 'user'}`);
	socket.data.isAdmin = isAdmin;

	// Attach session data to socket
	socket.data.sessionId = sessionId;
	socket.data.userId = userId;
	socket.data.username = username;

	// Send the sessionId back to the client
	socket.emit('session', { sessionId, userId, username, isAdmin });
	io.emit(DefaultSocketEvents.SYSTEM_MESSAGE, {
		message: `User ${username} connected`,
		timestamp: new Date().toISOString()
	});
	logger.info({
		event: 'User connected',
		Username: username,
		IsAdmin: isAdmin
	});

	return true;
};

const handleSession = async (
	socket: Socket,
	userId: string,
	username: string
): Promise<string> => {
	let sessionId = getSessionId(socket);
	logger.info(`SessionId: ${sessionId}`);

	if (sessionId) {
		const existingSession = await sessionStore.findSession(sessionId);
		if (!existingSession) {
			sessionId = v4();
			await sessionStore.saveSession(sessionId, {
				userId,
				username,
				timestamp: Date.now()
			});
			// logger.info({
			// 	event: 'New session created',
			// 	SessionId: sessionId.substring(0, 4),
			// 	UserId: userId,
			// 	Username: username
			// });
		} else {
			return sessionId;
			// logger.info({
			// 	event: 'Session found in redis',
			// 	SessionId: sessionId.substring(0, 4),
			// 	UserId: userId,
			// 	Username: username,
			// 	StartTime: startTime.toISOString()
			// });
		}
	} else {
		sessionId = v4();

		await sessionStore.saveSession(sessionId, {
			userId,
			username,
			timestamp: Date.now()
		});
		logger.warn({
			event: 'No sessionId provided by client, issuing new sessionId',
			NewSessionId: sessionId.substring(0, 4),
			UserId: userId,
			Username: username
		});
	}

	return sessionId;
};

// const getSessionId = (socket: Socket): string | undefined => {
// 	if (socket.handshake.auth && socket.handshake.auth.sessionId) {
// 		return socket.handshake.auth.sessionId as string;
// 	} else if (socket.handshake.query && socket.handshake.query.sessionId) {
// 		return socket.handshake.query.sessionId as string;
// 	} else {
// 		const cookies = cookie.parse(socket.handshake.headers.cookie || '');
// 		return cookies.sessionId;
// 	}
// };
const getSessionId = (socket: Socket): string | undefined => {
	return (
		(socket.handshake.auth?.sessionId as string) ??
		(socket.handshake.query?.sessionId as string) ??
		cookie.parse(socket.handshake.headers.cookie ?? '').sessionId
	);
};
