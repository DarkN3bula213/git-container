import { cache } from '@/data/cache/cache.service';
import { config } from '@/lib/config';
import { corsOptions } from '@/lib/config/cors';
import { Logger } from '@/lib/logger';
import {
	cancelSessionEnd // removeSaveSessionJob
} from '@/modules/auth/sessions/session.processor';
import { metrics } from '@/services/metrics';
import { ConnectedUser } from '@/types/connectedUsers';
import type { Server as HttpServer } from 'node:http';
import { type Socket, Server as SocketIOServer } from 'socket.io';
import {
	DefaultSocketEvents,
	handleAuth,
	handleDisconnect,
	handleMessages,
	handleUsers
} from './events';
import { handleImageTransfer } from './events/imageTransfer';
import { handleWebRTC } from './events/webRTC';

const logger = new Logger(__filename);

let socketParser: SocketIOServer;
class SocketService {
	readonly io: SocketIOServer;
	connectedUsers = new Map<string, ConnectedUser>();
	private static instance: SocketService;

	constructor(httpServer: HttpServer) {
		this.io = new SocketIOServer(httpServer, {
			serveClient: false,
			pingInterval: 10000,
			pingTimeout: 5000,
			cors: corsOptions
		});
		socketParser = this.io;

		this.io.engine.use(cache.cachedSession(config.tokens.jwtSecret));

		this.registerEvents();
	}

	public static getInstance(httpServer?: HttpServer): SocketService {
		if (!SocketService.instance && httpServer) {
			SocketService.instance = new SocketService(httpServer);
		}
		return SocketService.instance;
	}
	public emit(
		eventName: DefaultSocketEvents | string,
		message: string,
		roomId?: string
	): void {
		logger.debug(`Emitting event: ${eventName} to ${roomId}`);

		if (roomId) {
			this.io.to(roomId).emit(eventName, message);
		} else {
			this.io.emit(eventName, message);
		}
	}
	public emitToSocket(
		socketId: string,
		eventName: string,
		message: string
	): void {
		const socket = this.io.sockets.sockets.get(socketId);
		if (socket) {
			socket.emit(eventName, message);
		} else {
			logger.warn({
				event: 'Socket not found',
				SocketId: socketId.substring(0, 4)
			});
		}
	}

	private registerEvents(): void {
		this.io.on('connection', async (socket: Socket) => {
			try {
				metrics.socketConnectionsTotal.inc();
				const authResult = await handleAuth(socket, this.io);
				if (!authResult) return;
				// await removeSaveSessionJob(socket.data.userId);
				await cancelSessionEnd(socket.data.userId);
				handleUsers(socket, this.connectedUsers);

				await handleMessages(socket, this.io, this.connectedUsers);
				handleWebRTC(socket, this.io);
				handleImageTransfer(socket, this.io);

				socket.onAny((event, ...args) => {
					if (
						event !== 'joinConversation' ||
						event !== 'leaveConversation' ||
						event !== 'init' ||
						event !== 'userListUpdated'
					) {
						logger.warn({
							event: 'Incoming event',
							Event: event,
							Args: args
						});
					}
				});

				socket.onAnyOutgoing((event, ...args) => {
					if (
						event !== 'init' &&
						event !== 'joinConversation' &&
						// event !== 'userListUpdated' &&
						event !== 'video-offer' &&
						event !== 'video-answer'
					) {
						logger.debug({
							event: 'Outgoing event',
							Event: event,
							Args: args
						});
					} else {
						logger.debug({
							event: 'Outgoing event',
							Event: event
						});
					}
				});

				socket.on('disconnect', async () => {
					try {
						await handleDisconnect(
							socket,
							this.io,
							this.connectedUsers
						);
						metrics.socketConnectionsTotal.dec();
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					} catch (error: any) {
						logger.error({
							event: 'Error in handleDisconnect',
							SocketId: socket.id.substring(0, 4),
							Error: error.message
						});
					}
				});
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (error: any) {
				logger.error({
					event: 'Error during connection setup',
					SocketId: socket.id.substring(0, 4),
					Error: error.message
				});
			}
		});
	}
}

export { socketParser };

export default SocketService;
