// import { cache } from '@/data/cache/cache.service';
import { Logger } from '@/lib/logger';
import { getOrCreateConversation } from '@/modules/conversations/conversation.model';
import { ConnectedUser } from '@/types/connectedUsers';
import { Socket } from 'socket.io';
// import { Message, messageSingleton } from '../store/messageStore';
import { getOnlineUsers } from '../utils/getOnlineUsers';

const logger = new Logger(__filename);

const broadcastUserList = (
	socket: Socket,
	connectedUsers: Map<string, ConnectedUser>
) => {
	const onlineUsers = getOnlineUsers(connectedUsers);
	socket.broadcast.emit('userListUpdated', onlineUsers);
};
function updateUserSocket(
	connectedUsers: Map<string, ConnectedUser>,
	sessionId: string,
	newSocketId: string
) {
	if (connectedUsers.has(sessionId)) {
		const existingUser = connectedUsers.get(sessionId);
		if (existingUser && existingUser.socketId !== newSocketId) {
			connectedUsers.delete(sessionId);
			logger.warn(
				`Disconnecting duplicate connection for user with socketId ${existingUser.socketId}`
			);
		}
	}
}

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

const getConversationId = async (userId: string, socket: Socket) => {
	const user = socket.data.user;
	if (!user) {
		logger.error('User not found in socket data');
		return null;
	}
	try {
		const usersArr = [user._id, userId];
		const conversation = await getOrCreateConversation(usersArr);
		if (!conversation) {
			logger.error('Conversation not found');
			return null;
		}
		return conversation._id;
	} catch (error) {
		logger.error('Error getting conversation ID:', error);
		return null;
	}
};
// Handle message sending and receiving
// const handleMessageEvents = (
// 	socket: Socket,
// 	connectedUsers: Map<string, any>
// ) => {
// 	socket.on('privateMessage', async ({ toUserId, message }) => {
// 		const userId = socket.data.userId;
// 		const username = socket.data.username;
// 		const recipient = connectedUsers.get(toUserId);

// 		if (recipient) {
// 			const newMessage = {
// 				from: { userId, username, socketId: socket.id },
// 				to: recipient,
// 				content: message,
// 				timestamp: Date.now()
// 			} as Message;

// 			const conversationId = await getConversationId(toUserId, socket);

// 			let msg;
// 			if (!conversationId) {
// 				logger.error('Conversation ID not found');
// 				socket.emit('systemMessage', {
// 					message: `Must create a conversation with user ID: ${toUserId} before sending messages.`,
// 					timestamp: new Date().toISOString()
// 				});
// 				msg = newMessage;
// 			} else {
// 				msg = {
// 					...newMessage,
// 					conversationId
// 				};
// 				socket.emit('conversationId', conversationId);
// 			}

// 			await messageSingleton.saveMessage(msg as Message);

// 			socket.to(recipient.socketId).emit('messageReceived', {
// 				from: { userId, username, socketId: socket.id },
// 				to: {
// 					userId: recipient.userId,
// 					username: recipient.username,
// 					socketId: recipient.socketId
// 				},
// 				message,
// 				timestamp: new Date().toISOString()
// 			});
// 			logger.info(
// 				`Message sent to user ID: ${toUserId} (socket ID: ${recipient.socketId})`
// 			);
// 		} else {
// 			logger.warn(
// 				`Recipient with user ID: ${toUserId} not found or disconnected`
// 			);
// 			socket.emit('messageError', {
// 				message: 'User not found or disconnected'
// 			});
// 		}
// 	});

// 	/*=====  Start of the Conversation  ======*/

// 	// On Requesting Conversation ID
// 	socket.on('requestConversationId', async (userId) => {
// 		const conversationId = await getConversationId(userId, socket);
// 		if (conversationId) {
// 			socket.emit('conversationId', conversationId);
// 		} else {
// 			socket.emit('conversationId', null);
// 		}
// 	});
// };

const rooms: { [id: string]: string[] } = {};

const handleJoinRoom = (socket: Socket) => {
	socket.on('joinRoom', (roomId) => {
		if (rooms[roomId]) {
			rooms[roomId].push(socket.id);
		} else {
			rooms[roomId] = [socket.id];
		}
		const otherUser = rooms[roomId].find((id) => id !== socket.id);
		if (otherUser) {
			socket.emit('other user', otherUser);
			socket.to(otherUser).emit('user joined', socket.id);
		}
	});
};

const handleOffer = (socket: Socket) => {
	socket.on('offer', (payload) => {
		socket.to(payload.target).emit('offer', payload);
	});
};

const handleAnswer = (socket: Socket) => {
	socket.on('answer', (payload) => {
		socket.to(payload.target).emit('answer', payload);
	});
};

const handleCandidate = (socket: Socket) => {
	socket.on('candidate', (payload) => {
		socket.to(payload.target).emit('candidate', payload);
	});
};
export {
	// getOrSetStartTime,
	// handleDelayedJobs,
	// getStartTimeFromCache,
	// manageUserConnection,
	// handleMessageEvents,
	handleJoinRoom,
	handleOffer,
	handleAnswer,
	handleCandidate,
	getConversationId,
	joinUserRoom,
	broadcastUserList,
	updateUserSocket
};
