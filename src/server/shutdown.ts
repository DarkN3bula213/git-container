import { disconnectRedis } from '@/data/cache/cache.client';
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

let isShuttingDown = false;

export function setupGracefulShutdown(context: ServerContext): void {
	signals.forEach((signal) => {
		process.on(signal, async () => {
			try {
				// Prevent multiple shutdown attempts
				if (isShuttingDown) {
					logger.warn({
						event: 'Graceful Shutdown',
						message: 'Shutdown already in progress'
					});
					return;
				}
				isShuttingDown = true;

				logger.info({
					event: 'Graceful Shutdown',
					signal,
					message: 'Starting graceful shutdown...'
				});

				// Set a timeout for the entire shutdown process
				const shutdownTimeout = setTimeout(() => {
					logger.error('Shutdown timeout reached, forcing exit');
					process.exit(1);
				}, 10000); // 10 seconds timeout

				// First, stop accepting new connections
				context.server.close(() => {
					logger.debug('HTTP server closed.');
				});

				// Handle socket connections first
				if (context.socketService) {
					await context.socketService
						.disconnect()
						.catch((err: Error) => {
							logger.warn({
								event: 'Socket Shutdown',
								message: 'Error during socket disconnect',
								error: err.message
							});
						});
				}

				// Close Redis connection
				try {
					await disconnectRedis();
					logger.debug('Redis connection closed.');
				} catch (err) {
					logger.warn({
						event: 'Redis Shutdown',
						message:
							'Redis already disconnected or error during disconnect',
						error: err instanceof Error ? err.message : String(err)
					});
				}

				// Close database connection
				try {
					await db.disconnect();
					logger.debug('Database connection closed.');
				} catch (err) {
					logger.warn({
						event: 'Database Shutdown',
						message: 'Error during database disconnect',
						error: err instanceof Error ? err.message : String(err)
					});
				}

				clearTimeout(shutdownTimeout);
				logger.info({
					event: 'Graceful Shutdown',
					message: 'All connections closed successfully'
				});

				// Give time for final logs to be written
				setTimeout(() => process.exit(0), 100);
			} catch (error) {
				logger.error({
					event: 'Graceful Shutdown',
					message: 'Failed to shut down gracefully',
					error
				});
				process.exit(1);
			}
		});
	});
}
