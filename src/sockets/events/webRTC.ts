import { Server, Socket } from 'socket.io';
import { Logger } from '../../lib/logger';
import { emitMessage } from '../utils/emitMessage';

const logger = new Logger(__filename);

export const handleWebRTC = (socket: Socket, io: Server) => {
	const logEvent = (event: string, fromUserId: string, toUserId?: string) => {
		logger.info(`WebRTC Event: ${event}`, {
			fromUserId,
			toUserId,
			socketId: socket.id
		});
	};

	const handleError = (event: string, error: Error) => {
		logger.error(`Error in ${event}`, {
			error: error.message,
			stack: error.stack,
			socketId: socket.id,
			userId: socket.data.userId
		});
	};

	socket.on('video-offer', ({ toUserId, signal }) => {
		emitMessage(io, {
			receivers: [toUserId],
			event: 'video-answer',
			payload: { fromUserId: socket.data.userId, signal }
		});
	});

	socket.on(
		'video-answer',
		({ toUserId, signal }: { toUserId: string; signal: any }) => {
			emitMessage(io, {
				receivers: [toUserId],
				event: 'video-answer',
				payload: { fromUserId: socket.data.userId, signal }
			});
			logEvent('Video answer sent', socket.data.userId, toUserId);
		}
	);

	// Handle media track updates (device changes)
	socket.on('tracks-updated', ({ toUserId }) => {
		try {
			const fromUserId = socket.data.userId as string;
			emitMessage(io, {
				receivers: [toUserId],
				event: 'tracks-updated',
				payload: { fromUserId }
			});
			logEvent('Tracks updated', fromUserId, toUserId);
		} catch (error) {
			handleError('tracks-updated', error as Error);
		}
	});

	// Handle user disconnection
	socket.on('user-disconnect', () => {
		try {
			const userId = socket.data.userId as string;
			// Notify all connected peers about the disconnection
			socket.broadcast.emit('user-disconnect', { userId });
			logEvent('User disconnected', userId);
		} catch (error) {
			handleError('user-disconnect', error as Error);
		}
	});

	// Handle call initiation
	socket.on('initiate-call', ({ toUserId }) => {
		try {
			const fromUserId = socket.data.userId as string;
			emitMessage(io, {
				receivers: [toUserId],
				event: 'incoming-call',
				payload: { fromUserId }
			});
			logEvent('Call initiated', fromUserId, toUserId);
		} catch (error) {
			handleError('initiate-call', error as Error);
		}
	});

	// Handle call acceptance
	socket.on('accept-call', ({ toUserId }) => {
		try {
			const fromUserId = socket.data.userId as string;
			emitMessage(io, {
				receivers: [toUserId],
				event: 'call-accepted',
				payload: { fromUserId }
			});
			logEvent('Call accepted', fromUserId, toUserId);
		} catch (error) {
			handleError('accept-call', error as Error);
		}
	});

	// Handle call rejection
	socket.on('reject-call', ({ toUserId }) => {
		try {
			const fromUserId = socket.data.userId as string;
			emitMessage(io, {
				receivers: [toUserId],
				event: 'call-rejected',
				payload: { fromUserId }
			});
			logEvent('Call rejected', fromUserId, toUserId);
		} catch (error) {
			handleError('reject-call', error as Error);
		}
	});

	// Handle call ending
	socket.on('call-ended', ({ toUserId }) => {
		try {
			const fromUserId = socket.data.userId as string;
			emitMessage(io, {
				receivers: [toUserId],
				event: 'call-ended',
				payload: { fromUserId }
			});
			logEvent('Call ended', fromUserId, toUserId);
		} catch (error) {
			handleError('end-call', error as Error);
		}
	});

	// Handle ping for zombie prevention
	socket.on('ping', () => {
		try {
			socket.emit('pong');
			logEvent('Ping received', socket.data.userId as string);
		} catch (error) {
			handleError('ping', error as Error);
		}
	});

	socket.on('audio_message', async ({ toUserId, audio, timestamp }) => {
		try {
			const userId = socket.data.userId as string;

			// Validate the audio data
			if (!audio.startsWith('data:audio')) {
				throw new Error('Invalid audio format');
			}

			// Emit to the recipient
			io.to(toUserId).emit('audio_message', {
				fromUserId: userId,
				audio,
				timestamp
			});

			// Acknowledge the sender
			socket.emit('audio_message_sent', {
				success: true,
				timestamp
			});
		} catch (error) {
			console.error('Error handling audio message:', error);
			socket.emit('audio_message_error', {
				message: 'Failed to send audio message'
			});
		}
	});
};
