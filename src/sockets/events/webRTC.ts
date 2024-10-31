/* eslint-disable no-undef */
import { Server, Socket } from 'socket.io';
import { Logger } from '../../lib/logger';
import { emitMessage } from '../utils/emitMessage';

const logger = new Logger(__filename);

export const handleWebRTC = (socket: Socket, io: Server) => {
	const logEvent = (event: string, fromUserId: string, toUserId: string) => {
		// Log to console as well for now
		console.log(
			`WebRTC Event: ${event}, From: ${fromUserId}, To: ${toUserId}`
		);
		logger.info(`WebRTC Event: ${event}`, { fromUserId, toUserId });
	};
	const handleError = (event: string, error: Error) => {
		// Log error to console
		console.error(`Error in ${event}:`, error);
		logger.error(`Error in ${event}`, {
			error: error.message,
			stack: error.stack
		});
	};

	socket.on('video-offer', ({ toUserId, signal }) => {
		io.to(toUserId).emit('video-answer', {
			from: socket.data.userId,
			signal
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

	socket.on('reject-call', ({ toUserId }: { toUserId: string }) => {
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

	socket.on('initiate-call', ({ toUserId }: { toUserId: string }) => {
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

	socket.on('accept-call', ({ toUserId }: { toUserId: string }) => {
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

	socket.on('end-call', ({ toUserId }: { toUserId: string }) => {
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
};
