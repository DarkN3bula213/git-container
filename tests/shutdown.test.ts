import { Server } from 'http';
import { disconnectRedis } from '../src/data/cache/cache.client';
import { db } from '../src/data/database';
import {
	ServerContext,
	__test__,
	setupGracefulShutdown
} from '../src/server/shutdown';
import SocketService from '../src/sockets';

jest.mock('@/data/cache/cache.client');
jest.mock('@/data/database');
jest.mock('@/lib/logger');

describe('Graceful Shutdown', () => {
	let mockServer: jest.Mocked<Server>;
	let mockSocketService: jest.Mocked<SocketService>;
	let mockChangeStream: { close: jest.Mock };
	let context: ServerContext;

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Mock server
		mockServer = {
			close: jest.fn((cb) => cb())
		} as unknown as jest.Mocked<Server>;

		// Mock socket service
		mockSocketService = {
			disconnect: jest.fn().mockResolvedValue(undefined)
		} as unknown as jest.Mocked<SocketService>;

		// Mock change stream
		mockChangeStream = {
			close: jest.fn().mockResolvedValue(undefined)
		};

		// Setup context
		context = {
			server: mockServer,
			socketService: mockSocketService,
			port: 3000,
			changeStreams: [mockChangeStream]
		};

		// Mock process.exit
		const realExit = process.exit;
		process.exit = jest.fn() as never;

		// Cleanup
		return () => {
			process.exit = realExit;
		};
	});

	describe('closeChangeStreams', () => {
		it('should close all change streams', async () => {
			await __test__.closeChangeStreams([mockChangeStream]);
			expect(mockChangeStream.close).toHaveBeenCalled();
		});

		it('should handle errors gracefully', async () => {
			mockChangeStream.close.mockRejectedValue(new Error('Test error'));
			await __test__.closeChangeStreams([mockChangeStream]);
			expect(mockChangeStream.close).toHaveBeenCalled();
		});
	});

	describe('closeServer', () => {
		it('should close the server', async () => {
			await __test__.closeServer(mockServer);
			expect(mockServer.close).toHaveBeenCalled();
		});
	});

	describe('setupGracefulShutdown', () => {
		it('should set up signal handlers', () => {
			const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
			const processOn = jest.spyOn(process, 'on');

			setupGracefulShutdown(context);

			signals.forEach((signal) => {
				expect(processOn).toHaveBeenCalledWith(
					signal,
					expect.any(Function)
				);
			});
		});

		it('should execute shutdown sequence when signal is received', async () => {
			setupGracefulShutdown(context);

			// Trigger SIGTERM
			process.emit('SIGTERM');

			// Wait for async operations
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockServer.close).toHaveBeenCalled();
			expect(mockChangeStream.close).toHaveBeenCalled();
			expect(mockSocketService.disconnect).toHaveBeenCalled();
			expect(disconnectRedis).toHaveBeenCalled();
			expect(db.disconnect).toHaveBeenCalled();
		});

		it('should prevent multiple shutdown attempts', async () => {
			setupGracefulShutdown(context);

			// Trigger SIGTERM twice
			process.emit('SIGTERM');
			process.emit('SIGTERM');

			// Wait for async operations
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockServer.close).toHaveBeenCalledTimes(1);
			expect(__test__.isShuttingDown()).toBe(true);
		});
	});
});
