// import { Logger } from '@/lib/logger';
// import { verifyToken } from '@/lib/utils/tokens';
// import {
// 	generateConversationKey,
// 	getOrCreateConversation,
// 	saveMessageInConversation
// } from '@/modules/conversations/conversation.utils';

// import cookie from 'cookie';
// import { Server, Socket } from 'socket.io';
// import { v4 } from 'uuid';

// import { sessionStore } from '../store/session-store';
// import { getOrSetStartTime } from './socket.events';

// const logger = new Logger(__filename);
// // Utility functions to handle token verification, Redis, etc.

// export const handleAuth = async (socket: Socket): Promise<boolean> => {
// 	logger.debug('Handling auth');

// 	const cookies = cookie.parse(socket.handshake.headers.cookie || '');
// 	const authToken = cookies.access;

// 	if (!authToken) {
// 		logger.warn(
// 			`No auth token provided, disconnecting socket ${socket.id}`
// 		);
// 		socket.disconnect();
// 		return false;
// 	}

// 	const verificationResult = verifyToken(authToken, 'access');
// 	if (!verificationResult.valid) {
// 		logger.warn(`Invalid auth token, disconnecting socket ${socket.id}`);
// 		socket.disconnect();
// 		return false;
// 	}

// 	const user = verificationResult.decoded?.user;
// 	const userId = user?._id;
// 	const username = user?.username;

// 	if (!userId || !username) {
// 		logger.warn(`Invalid user data, disconnecting socket ${socket.id}`);
// 		socket.disconnect();
// 		return false;
// 	}
// 	await getOrSetStartTime(userId, socket);
// 	// Read sessionId from the correct place based on Socket.IO version
// 	let sessionId: string | undefined;

// 	// For Socket.IO v3 and above
// 	if (socket.handshake.auth && socket.handshake.auth.sessionId) {
// 		sessionId = socket.handshake.auth.sessionId as string;
// 		logger.debug(`Received sessionId from client (auth): ${sessionId}`);
// 	}
// 	// For Socket.IO v2
// 	else if (socket.handshake.query && socket.handshake.query.sessionId) {
// 		sessionId = socket.handshake.query.sessionId as string;
// 		logger.debug(`Received sessionId from client (query): ${sessionId}`);
// 	}
// 	// Fallback to cookies (if necessary)
// 	else if (cookies.sessionId) {
// 		sessionId = cookies.sessionId;
// 		logger.debug(`Received sessionId from client (cookies): ${sessionId}`);
// 	}

// 	if (sessionId) {
// 		const existingSession = await sessionStore.findSession(sessionId);
// 		if (existingSession) {
// 			logger.info(`Found existing session: ${sessionId}`);
// 			// Optionally update session data if needed
// 		} else {
// 			// Session expired or invalid, create a new one
// 			logger.warn(`Session ${sessionId} not found, creating new session`);
// 			sessionId = v4();
// 			await sessionStore.saveSession(sessionId, { userId, username });
// 			logger.info(`New session created with sessionId: ${sessionId}`);
// 		}
// 	} else {
// 		// Generate a new sessionId
// 		sessionId = v4();
// 		logger.warn(
// 			`No sessionId provided by client, issuing new sessionId: ${sessionId}`
// 		);
// 		await sessionStore.saveSession(sessionId, { userId, username });
// 	}

// 	// Attach session data to socket
// 	socket.data.sessionId = sessionId;
// 	socket.data.userId = userId;
// 	socket.data.username = username;

// 	// Send the sessionId back to the client
// 	socket.emit('session', { sessionId, userId, username });

// 	logger.info(`User ${username} authenticated with sessionId ${sessionId}`);

// 	return true;
// };
// export const handleUsers = async (
// 	socket: Socket,
// 	connectedUsers: Map<
// 		string,
// 		{ userId: string; username: string; socketId: string }
// 	>
// ) => {
// 	const userId = socket.data.userId as string;
// 	const username = socket.data.username as string;
// 	const sessionId = socket.data.sessionId as string;

// 	if (!userId || !username || !sessionId) {
// 		logger.error('User not authenticated, cannot manage connection.');
// 		return;
// 	}

// 	logger.info(`Managing connection for user ${username} (${userId})`);

// 	// Remove any existing sockets associated with this sessionId
// 	if (connectedUsers.has(sessionId)) {
// 		const existingUser = connectedUsers.get(sessionId);
// 		if (existingUser && existingUser.socketId !== socket.id) {
// 			// Disconnect the old socket
// 			const oldSocketId = existingUser.socketId;
// 			connectedUsers.delete(sessionId);
// 			logger.warn(
// 				`Disconnecting duplicate connection for user ${username} with socketId ${oldSocketId}`
// 			);
// 		}
// 	}

// 	// Add/update the user in connectedUsers map
// 	connectedUsers.set(sessionId, {
// 		userId,
// 		username,
// 		socketId: socket.id
// 	});

// 	logger.info(
// 		`User ${username} connected with sessionId ${sessionId} and socketId ${socket.id}`
// 	);

// 	// Broadcast updated user list
// 	const onlineUsers = Array.from(connectedUsers.values());
// 	socket.broadcast.emit('userListUpdated', onlineUsers);
// 	logger.debug('Broadcasted updated user list', { onlineUsers });
// };

// export const handleDisconnect = async (
// 	socket: Socket,
// 	connectedUsers: Map<string, Socket>,
// 	io: Server
// ) => {
// 	const sessionId = socket.data.sessionId as string;
// 	// Check if the user has any other active sockets
// 	const userId = socket.data.userId as string;
// 	const matchingSockets = await io.in(userId).allSockets();
// 	const isDisconnected = matchingSockets.size === 0;
// 	if (isDisconnected) {
// 		// User is fully disconnected
// 		connectedUsers.delete(userId);
// 		logger.info(`User ${userId} disconnected completely`);

// 		// Notify other users
// 		socket.broadcast.emit('user disconnected', userId);
// 	} else {
// 		logger.info(
// 			`User ${userId} still connected with ${matchingSockets.size} socket(s)`
// 		);
// 	}
// 	if (connectedUsers.has(sessionId)) {
// 		connectedUsers.delete(sessionId);
// 		logger.info(`User ${socket.data.username} disconnected`);

// 		// Broadcast updated user list
// 		const onlineUsers = Array.from(connectedUsers.values()).map((s) => ({
// 			userId: s.data.userId,
// 			username: s.data.username,
// 			sessionId: s.data.sessionId
// 		}));
// 		socket.broadcast.emit('userListUpdated', onlineUsers);
// 	} else {
// 		logger.info(
// 			`User ${socket.data.username} disconnected but was not in connectedUsers`
// 		);
// 	}
// };

// export const handleMessages = async (socket: Socket, io: Server) => {
// 	socket.on('requestConversationId', async (userId) => {
// 		const conversationId = await getConversationId(userId, socket);
// 		if (conversationId) {
// 			socket.emit('conversationId', conversationId);
// 		} else {
// 			socket.emit('conversationId', null);
// 		}
// 	});
// 	socket.on(
// 		'privateMessage',
// 		async ({ toUserId, message, conversationId }) => {
// 			const fromUserId = socket.data.userId as string;

// 			if (!conversationId) {
// 				socket.emit('messageError', {
// 					message: 'Conversation not found'
// 				});
// 				return;
// 			}

// 			try {
// 				// Save the message in the conversation
// 				const savedMessage = await saveMessageInConversation({
// 					conversationId,
// 					senderId: fromUserId,
// 					content: message
// 				});

// 				emitMessage(io, {
// 					receivers: [toUserId, fromUserId],
// 					event: 'messageReceived',
// 					payload: {
// 						conversationId,
// 						sender: fromUserId,
// 						message: savedMessage.content,
// 						timestamp: savedMessage.timestamp
// 					}
// 				});

// 				logger.info(
// 					`Message sent from user ${fromUserId} to user ${toUserId}`
// 				);
// 			} catch (error) {
// 				socket.emit('messageError', {
// 					message: 'Failed to send message'
// 				});
// 				logger.error('Error sending message', error);
// 			}
// 			// Add handlers for typing events
// 			socket.on('typing', ({ toUserId, conversationId }) => {
// 				emitMessage(io, {
// 					receivers: [toUserId],
// 					event: 'userTyping',
// 					payload: { conversationId, userId: socket.data.userId }
// 				});
// 			});

// 			socket.on('stoppedTyping', ({ toUserId, conversationId }) => {
// 				emitMessage(io, {
// 					receivers: [toUserId],
// 					event: 'userStoppedTyping',
// 					payload: { conversationId, userId: socket.data.userId }
// 				});
// 			});
// 		}
// 	);
// };

// const getConversationId = async (userId: string, socket: Socket) => {
// 	const user = socket.data.user;
// 	if (!user) {
// 		logger.error('User not found in socket data');
// 		return null;
// 	}
// 	try {
// 		const key = generateConversationKey(user._id, userId);

// 		const conversation = await getOrCreateConversation(key[0], key[1]);
// 		if (!conversation) {
// 			logger.error('Conversation not found');
// 			return null;
// 		}
// 		return conversation._id;
// 	} catch (error) {
// 		logger.error('Error getting conversation ID:', error);
// 		return null;
// 	}
// };
// const emitMessage = (
// 	io: Server,
// 	{
// 		receivers,
// 		event,
// 		payload
// 	}: {
// 		receivers: string[];
// 		event: string;
// 		payload: object;
// 	}
// ) => {
// 	receivers.forEach((receiverId) => {
// 		io.to(receiverId).emit(event, payload);
// 	});
// };
