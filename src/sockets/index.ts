import { cache } from '@/data/cache/cache.service';
import { config } from '@/lib/config';
import { corsOptions } from '@/lib/config/cors';
import { Logger } from '@/lib/logger';
import { removeSaveSessionJob } from '@/modules/auth/sessions/session.processor';
import { ConnectedUser } from '@/types/connectedUsers';
import type { Server as HttpServer } from 'node:http';
import { type Socket, Server as SocketIOServer } from 'socket.io';
import {
	handleAuth,
	handleDisconnect,
	handleMessages,
	handleUsers
} from './events';
import { handleImageTransfer } from './events/imageTransfer';
import { handleWebRTC } from './events/webRTC';

const logger = new Logger(__filename);
export let socketParser: SocketIOServer;
class SocketService {
	private io: SocketIOServer;
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
	public emit(eventName: string, message: any, roomId?: string): void {
		if (roomId) {
			this.io.to(roomId).emit(eventName, message);
		} else {
			this.io.emit(eventName, message);
		}
	}
	public emitToSocket(
		socketId: string,
		eventName: string,
		message: any
	): void {
		const socket = this.io.sockets.sockets.get(socketId);
		if (socket) {
			socket.emit(eventName, message);
		} else {
			logger.warn(`Socket ${socketId} not found`);
		}
	}

	private registerEvents(): void {
		this.io.on('connection', async (socket: Socket) => {
			try {
				const authResult = await handleAuth(socket, this.io);
				if (!authResult) return;
				await removeSaveSessionJob(socket.data.userId);
				await handleUsers(socket, this.connectedUsers);
				// console.log(JSON.stringify(this.connectedUsers, null, 2));
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
							all: event,
							arguments: JSON.stringify(args, null, 2)
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
							outgoing: `Outgoing ${event}`,
							arguments: JSON.stringify(args, null, 2)
						});
					} else {
						logger.debug({
							outgoing: `Outgoing ${event}`
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
					} catch (error: any) {
						logger.error(
							`Error in handleDisconnect for socket ${socket.id}: ${error.message}`
						);
					}
				});
			} catch (error: any) {
				logger.error(
					`Error during connection setup for socket ${socket.id}: ${error.message}`
				);
			}
		});
	}
}

export default SocketService;
