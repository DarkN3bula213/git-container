import { disconnectRedis } from '@/data/cache/cache.client';
// import { cache } from '@/data/cache/cache.service';
import { db } from '@/data/database';
import { signals } from '@/lib/constants';
import { Logger } from '@/lib/logger';
import SocketService from '@/sockets';
import { Server } from 'http';

export interface ServerContext {
	server: Server;
	socketService: SocketService;
	port: number;
}

const logger = new Logger('server/shutdown');

export function setupGracefulShutdown(context: ServerContext): void {
	signals.forEach((signal) => {
		process.on(signal, async () => {
			try {
				logger.debug(`Received ${signal}. Shutting down gracefully...`);

				const serverClosed = new Promise((resolve) => {
					context.server.close(() => {
						logger.debug('HTTP server closed.');
						resolve(true);
					});
				});

				if (context.socketService) {
					context.socketService.disconnect();
					logger.debug('WebSocket connections closed.');
				}

				await Promise.all([
					serverClosed,
					disconnectRedis().catch((err) => {
						logger.error('Error disconnecting cache:', err);
					}),
					db.disconnect().catch((err) => {
						logger.error('Error disconnecting database:', err);
					})
				]);

				logger.debug('All connections closed successfully.');
				process.exit(0);
			} catch (error) {
				logger.error('Failed to shut down gracefully', error);
				setTimeout(() => process.exit(1), 100);
			}
		});
	});
}
