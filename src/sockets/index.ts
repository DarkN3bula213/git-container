import { cache } from '@/data/cache/cache.service';
import { config } from '@/lib/config';
import { corsOptions } from '@/lib/config/cors';
import { Logger } from '@/lib/logger';
import { removeSaveSessionJob } from '@/modules/auth/sessions/session.processor';
import { getAllConversationsForUser } from '@/modules/conversations/conversation.utils';

import type { Server as HttpServer } from 'node:http';
import { type Socket, Server as SocketIOServer } from 'socket.io';

import { handleConnect, handleDisconnect } from './events';
import {
	handleAuth,
	handleMessages,
	handleUsers
} from './events/handleAuthentication';

const logger = new Logger(__filename);

export let socketParser: SocketIOServer;

class SocketService {
	private io: SocketIOServer;
	connectedUsers = new Map<
		string,
		{ userId: string; username: string; socketId: string }
	>();
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
	public broadcast(eventName: string, message: any): void {
		this.io.emit(eventName, message);
	}
	private registerEvents(): void {
		this.io.on('connection', async (socket: Socket) => {
			try {
				// Handle the connection logic immediately

				const authResult = await handleAuth(socket);
				if (!authResult) return;
				await removeSaveSessionJob(socket.data.userId);
				await handleUsers(socket, this.connectedUsers);

				/*=============================================
				=            Section comment block            =
				=============================================*/
				// Join the user room
				const userId = socket.data.userId as string;
				socket.join(userId);
				logger.info(`Socket ${socket.id} joined room ${userId}`);

				// Emit the initial data to the client
				const onlineUsers = Array.from(
					this.connectedUsers.values()
				).map((user) => ({
					userId: user.userId,
					username: user.username
				}));
				const conversations = await getAllConversationsForUser(userId);

				socket.on('joinConversation', async () => {
					socket.emit('init', {
						currentUser: {
							userId,
							username: socket.data.username,
							socketId: socket.id
						},
						onlineUsers,
						conversations
					});
				});

				socket.broadcast.emit(
					'userListUpdated',
					Array.from(onlineUsers.values())
				);

				/*=====  End of Section comment block  ======*/

				await handleMessages(socket, this.io);
				/*=====  End of Section comment block  ======*/

				// socket.onAny((event, ...args) => {
				// 	logger.warn({
				// 		event: event,
				// 		arguments: JSON.stringify(args, null, 2)
				// 	});
				// });

				// socket.onAnyOutgoing((event, ...args) => {
				// 	logger.debug({
				// 		outgoing: `Outgoing ${event}`,
				// 		arguments: JSON.stringify(args, null, 2)
				// 	});
				// });

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
