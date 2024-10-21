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
	 socket.on('startCall', ({ to }) => {
			console.log(`startCall event received. Target user ID: ${to}`);
			io.to(to).emit('incomingCallNotification', {
				from: socket.data.userId
			});
		});

		socket.on('acceptCall', ({ from }) => {
			console.log(`Call accepted by ${socket.data.userId} from ${from}`);
			io.to(from).emit('callAccepted', {
				by: socket.data.userId
			});
		});

		socket.on('video-offer', ({ to, signal }) => {
			console.log('Sending video offer to:', to);
			io.to(to).emit('video-answer', {
				from: socket.data.userId,
				signal
			});
		});

		socket.on('endCall', ({ to }) => {
			console.log(`Call ended between ${socket.data.userId} and ${to}`);
			io.to(to).emit('callEnded', { by: socket.data.userId });
		});
	socket.on(
		'video-offer',
		({ 
			toUserId,
			sdp
		}: {
			toUserId: string;
			sdp: RTCSessionDescriptionInit;
		}) => {
			try {
				// Log a message when the video offer is received
				console.log('Received video-offer event');

				const fromUserId = socket.data.userId as string;

				emitMessage(io, {
					receivers: [toUserId],
					event: 'video-offer',
					payload: { fromUserId, sdp }
				});

				logEvent('Video offer sent', fromUserId, toUserId);
			} catch (error) {
				handleError('video-offer', error as Error);
			}
		}
	);
 
	socket.on(
		'video-answer',
		({
			toUserId,
			sdp
		}: {
			toUserId: string;
			sdp: RTCSessionDescriptionInit;
		}) => {
			try {
				const fromUserId = socket.data.userId as string;
				emitMessage(io, {
					receivers: [toUserId],
					event: 'video-answer',
					payload: { fromUserId, sdp }
				});
				logEvent('Video answer sent', fromUserId, toUserId);
			} catch (error) {
				handleError('video-answer', error as Error);
			}
		}
	);

	socket.on(
		'new-ice-candidate',
		({
			toUserId,
			candidate
		}: {
			toUserId: string;
			candidate: RTCIceCandidateInit;
		}) => {
			try {
				const fromUserId = socket.data.userId as string;
				emitMessage(io, {
					receivers: [toUserId],
					event: 'new-ice-candidate',
					payload: { fromUserId, candidate }
				});
				logEvent('New ICE candidate sent', fromUserId, toUserId);
			} catch (error) {
				handleError('new-ice-candidate', error as Error);
			}
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

	// New method for handling screen sharing offer
	socket.on(
		'screen-share-offer',
		({
			toUserId,
			sdp
		}: {
			toUserId: string;
			sdp: RTCSessionDescriptionInit;
		}) => {
			try {
				const fromUserId = socket.data.userId as string;
				emitMessage(io, {
					receivers: [toUserId],
					event: 'screen-share-offer',
					payload: { fromUserId, sdp }
				});
				logEvent('Screen share offer sent', fromUserId, toUserId);
			} catch (error) {
				handleError('screen-share-offer', error as Error);
			}
		}
	);

	// New method for handling screen sharing answer
	socket.on(
		'screen-share-answer',
		({
			toUserId,
			sdp
		}: {
			toUserId: string;
			sdp: RTCSessionDescriptionInit;
		}) => {
			try {
				const fromUserId = socket.data.userId as string;
				emitMessage(io, {
					receivers: [toUserId],
					event: 'screen-share-answer',
					payload: { fromUserId, sdp }
				});
				logEvent('Screen share answer sent', fromUserId, toUserId);
			} catch (error) {
				handleError('screen-share-answer', error as Error);
			}
		}
	);

	// New method for handling call initiation
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

	// New method for handling call acceptance
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

	// New method for handling call end
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

	// New method for handling mute/unmute
	socket.on(
		'toggle-audio',
		({ toUserId, isMuted }: { toUserId: string; isMuted: boolean }) => {
			try {
				const fromUserId = socket.data.userId as string;
				emitMessage(io, {
					receivers: [toUserId],
					event: 'audio-toggle',
					payload: { fromUserId, isMuted }
				});
				logEvent(
					`Audio ${isMuted ? 'muted' : 'unmuted'}`,
					fromUserId,
					toUserId
				);
			} catch (error) {
				handleError('toggle-audio', error as Error);
			}
		}
	);

	// New method for handling video on/off
	socket.on(
		'toggle-video',
		({
			toUserId,
			isVideoOff
		}: {
			toUserId: string;
			isVideoOff: boolean;
		}) => {
			try {
				const fromUserId = socket.data.userId as string;
				emitMessage(io, {
					receivers: [toUserId],
					event: 'video-toggle',
					payload: { fromUserId, isVideoOff }
				});
				logEvent(
					`Video ${isVideoOff ? 'turned off' : 'turned on'}`,
					fromUserId,
					toUserId
				);
			} catch (error) {
				handleError('toggle-video', error as Error);
			}
		}
	);
};