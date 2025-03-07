import { config } from '@/lib/config/config';
import { format } from 'date-fns';
import http from 'node:http';
import { app } from './app';
import { banner } from './lib/constants';
import { Logger } from './lib/logger';
import { initializeServer } from './server/initialize';
import { ServerContext, setupGracefulShutdown } from './server/shutdown';

const logger = new Logger(__filename);

async function createServerContext(): Promise<ServerContext> {
	const server = http.createServer(app);
	const socketService = await initializeServer.setupWebSockets(server);

	return {
		server,
		socketService,
		port: config.app.port
	};
}

async function logServerStartup(): Promise<void> {
	const date = new Date();
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const pkTime = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Asia/Karachi',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	}).format(date);

	logger.warn('🚀 Server started 2', {
		port: config.app.port,
		node: banner,
		date: format(date, 'PPP'),
		timeZone,
		pkTime,
		mode: config.isProduction ? 'Production' : 'Development'
	});
}

async function bootstrap() {
	try {
		// Initialize configuration first
		await initializeServer.config();

		// Setup required directories
		await initializeServer.directories();

		// Initialize data sources (DB & Cache)
		await initializeServer.dataSources();

		// Create and configure server
		const serverContext = await createServerContext();

		// Production-specific initialization
		if (config.isProduction) {
			await initializeServer.productionTasks();
		}

		// Start server
		serverContext.server.listen(serverContext.port, async () => {
			await logServerStartup();
			// await testInvoiceIdGenerator();
		});

		// Setup graceful shutdown handlers
		setupGracefulShutdown(serverContext);

		return serverContext;
	} catch (error) {
		logger.error('💥 Bootstrap failed:', error);
		process.exit(1);
	}
}

// Export socket service for use in other parts of the application
export { socketService } from './server/initialize';

// Start the application
bootstrap().catch((error) => {
	logger.error('🔥 Fatal error during startup:', error);
	process.exit(1);
});
