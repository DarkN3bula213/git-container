// // src/events/handleWebRTCSignaling.ts
// import { Logger } from '@/lib/logger';

// import { Server, Socket } from 'socket.io';

// const logger = new Logger(__filename);

// export const handleWebRTCSignaling = (
// 	socket: Socket,
// 	io: Server,
// 	connectedUsers: Map<
// 		string,
// 		{ userId: string; username: string; socketId: string }
// 	>
// ): void => {
// 	const userId = socket.data.userId as string;
// 	const sessionId = socket.data.sessionId as string;

// 	if (!sessionId || !userId) {
// 		logger.error('Session or user not identified for signaling.');
// 		return;
// 	}

// 	logger.debug(
// 		`Socket ${socket.id} connected for WebRTC signaling as user ${userId} with session ${sessionId}`
// 	);

// 	// Handle SDP offer
// 	socket.on('webrtc-offer', (data) => {
// 		const { targetUserId, offer } = data;
// 		logger.debug(`Received offer from ${userId} for ${targetUserId}`);

// 		// Emit offer to the target user (targetUserId) and current user (userId)
// 		io.to(targetUserId).to(userId).emit('webrtc-offer', {
// 			offer,
// 			from: userId
// 		});
// 		logger.debug(`Sent offer to ${targetUserId}`);
// 	});

// 	// Handle SDP answer
// 	socket.on('webrtc-answer', (data) => {
// 		const { targetUserId, answer } = data;
// 		logger.debug(`Received answer from ${userId} for ${targetUserId}`);

// 		io.to(targetUserId).to(userId).emit('webrtc-answer', {
// 			answer,
// 			from: userId
// 		});
// 		logger.debug(`Sent answer to ${targetUserId}`);
// 	});

// 	// Handle ICE candidate
// 	socket.on('webrtc-ice-candidate', (data) => {
// 		const { targetUserId, candidate } = data;
// 		logger.debug(
// 			`Received ICE candidate from ${userId} for ${targetUserId}`
// 		);

// 		io.to(targetUserId).to(userId).emit('webrtc-ice-candidate', {
// 			candidate,
// 			from: userId
// 		});
// 		logger.debug(`Sent ICE candidate to ${targetUserId}`);
// 	});

// 	// Handle disconnects
// 	socket.on('disconnect', () => {
// 		logger.debug(`Socket ${socket.id} disconnected from WebRTC signaling`);
// 		connectedUsers.delete(sessionId); // Optionally remove the user from the map on disconnect
// 	});
// };
