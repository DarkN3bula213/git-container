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
	changeStreams?: Array<{ close: () => Promise<void> }>;
}

const logger = new Logger('server/shutdown');

let isShuttingDown = false;

async function closeChangeStreams(
	streams?: Array<{ close: () => Promise<void> }>
) {
	if (!streams?.length) return;

	logger.debug('Closing change streams...');
	await Promise.all(
		streams.map((stream) =>
			stream.close().catch((err) => {
				logger.warn('Error closing change stream: ' + err.message);
			})
		)
	);
	logger.debug('Change streams closed.');
}

async function closeServer(server: Server): Promise<void> {
	return new Promise((resolve) => {
		server.close(() => {
			logger.debug('HTTP server closed.');
			resolve();
		});
	});
}

export function setupGracefulShutdown(context: ServerContext): void {
	signals.forEach((signal) => {
		process.on(signal, async () => {
			try {
				// Prevent multiple shutdown attempts
				if (isShuttingDown) {
					logger.warn('Shutdown already in progress');
					return;
				}
				isShuttingDown = true;

				logger.info(`Starting graceful shutdown... (${signal})`);

				// Set a timeout for the entire shutdown process
				const shutdownTimeout = setTimeout(() => {
					logger.error('Shutdown timeout reached, forcing exit');
					process.exit(1);
				}, 10000); // 10 seconds timeout

				// Execute shutdown sequence
				try {
					// 1. Stop accepting new connections
					await closeServer(context.server);

					// 2. Close all change streams first to prevent MongoDB connection errors
					await closeChangeStreams(context.changeStreams);

					// 3. Handle socket connections
					if (context.socketService) {
						await context.socketService.disconnect();
						logger.debug('Socket connections closed.');
					}

					// 4. Close Redis connection
					await disconnectRedis();
					logger.debug('Redis connection closed.');

					// 5. Close database connection last
					await db.disconnect();
					logger.debug('Database connection closed.');

					clearTimeout(shutdownTimeout);
					logger.info('All connections closed successfully');

					// Give time for final logs to be written
					setTimeout(() => process.exit(0), 100);
				} catch (error) {
					clearTimeout(shutdownTimeout);
					logger.error(
						'Failed to shut down gracefully: ' +
							(error instanceof Error
								? error.message
								: String(error))
					);
					process.exit(1);
				}
			} catch (error) {
				logger.error(
					'Critical error during shutdown: ' +
						(error instanceof Error ? error.message : String(error))
				);
				process.exit(1);
			}
		});
	});
}

// For testing purposes
export const __test__ = {
	closeChangeStreams,
	closeServer,
	isShuttingDown: () => isShuttingDown
};
