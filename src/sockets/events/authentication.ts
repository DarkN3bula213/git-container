import { Logger } from '@/lib/logger';
import { verifyToken } from '@/lib/utils/tokens';
import { isUserAdmin } from '@/modules/auth/users/user.model';
import cookie from 'cookie';
import { Server, Socket } from 'socket.io';
import { v4 } from 'uuid';
import { sessionStore } from '../store/session-store';
import { getOrSetStartTime } from '../utils/getStartTimeFromCache';

const logger = new Logger(__filename);

export const handleAuth = async (
	socket: Socket,
	io: Server
): Promise<boolean> => {
	const cookies = cookie.parse(socket.handshake.headers.cookie || '');
	const authToken = cookies.access;

	if (!authToken) {
		logger.warn(
			`No auth token provided, disconnecting socket ${socket.id}`
		);
		socket.emit('logout');
		socket.disconnect();
		return false;
	}

	const verificationResult = verifyToken(authToken, 'access');
	if (!verificationResult.valid) {
		logger.warn(`Invalid auth token, disconnecting socket ${socket.id}`);
		socket.emit('logout');
		socket.disconnect();
		return false;
	}

	const user = verificationResult.decoded?.user;
	const userId = user?._id;
	const username = user?.username;

	if (!userId || !username) {
		logger.warn(`Invalid user data, disconnecting socket ${socket.id}`);
		socket.disconnect();
		return false;
	}

	await getOrSetStartTime(userId.toString(), socket);

	const sessionId = await handleSession(socket, userId.toString(), username);
	const isAdmin = await isUserAdmin(userId);
	logger.info(`User ${username} is admin: ${isAdmin}`);
	socket.data.isAdmin = isAdmin;

	// Attach session data to socket
	socket.data.sessionId = sessionId;
	socket.data.userId = userId;
	socket.data.username = username;

	// Send the sessionId back to the client
	socket.emit('session', { sessionId, userId, username, isAdmin });
	io.emit('systemMessage', {
		message: `User ${username} connected`,
		timestamp: new Date().toISOString()
	});
	logger.info(`User ${username} authenticated with sessionId ${sessionId}`);

	return true;
};

const handleSession = async (
	socket: Socket,
	userId: string,
	username: string
): Promise<string> => {
	let sessionId = getSessionId(socket);

	if (sessionId) {
		const existingSession = await sessionStore.findSession(sessionId);
		if (!existingSession) {
			logger.warn(`Session ${sessionId} not found, creating new session`);
			sessionId = v4();
			await sessionStore.saveSession(sessionId, { userId, username });
			logger.info(`New session created with sessionId: ${sessionId}`);
		}
	} else {
		sessionId = v4();
		logger.warn(
			`No sessionId provided by client, issuing new sessionId: ${sessionId}`
		);
		await sessionStore.saveSession(sessionId, { userId, username });
	}

	return sessionId;
};

const getSessionId = (socket: Socket): string | undefined => {
	if (socket.handshake.auth && socket.handshake.auth.sessionId) {
		return socket.handshake.auth.sessionId as string;
	} else if (socket.handshake.query && socket.handshake.query.sessionId) {
		return socket.handshake.query.sessionId as string;
	} else {
		const cookies = cookie.parse(socket.handshake.headers.cookie || '');
		return cookies.sessionId;
	}
};
