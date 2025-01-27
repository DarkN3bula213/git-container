import { config } from '@/lib/config/config';
import { Logger } from '@/lib/logger';
import { type RedisClientType, createClient } from 'redis';

const logger = new Logger(__filename);

class RedisConnection {
	private readonly client: RedisClientType;
	private retryCount = 0;
	private readonly maxRetries = 5;
	private readonly initialRetryDelay = 1000; // 1 second
	private readonly maxRetryDelay = 30000; // 30 seconds
	private connecting = false;

	constructor() {
		this.client = this.createRedisClient();
		this.setupEventHandlers();
	}

	private createRedisClient(): RedisClientType {
		return createClient({
			url: config.isDevelopment
				? 'redis://localhost:6379'
				: process.env.REDIS_URL,
			socket: {
				reconnectStrategy: (retries: number) => {
					if (retries >= this.maxRetries) {
						logger.error(
							'Max reconnection attempts reached. Giving up.'
						);
						return new Error('Max reconnection attempts reached');
					}

					// Exponential backoff with jitter
					const delay = Math.min(
						this.initialRetryDelay * Math.pow(2, retries) +
							Math.random() * 1000,
						this.maxRetryDelay
					);
					const delayInSeconds = (delay / 1000).toFixed(2);
					logger.warn(
						`Attempting reconnection #${retries + 1} in ${delayInSeconds}s`
					);
					return delay;
				}
			}
		});
	}

	private setupEventHandlers(): void {
		this.client.on('connect', () => {
			this.retryCount = 0;
		});

		this.client.on('ready', () => {
			logger.debug('Redis connection established');
			this.connecting = false;
			this.retryCount = 0;
		});

		this.client.on('end', () => {
			logger.debug('Redis connection closed');
			this.connecting = false;
		});

		this.client.on('reconnecting', () => {
			this.retryCount++;
			logger.debug(`Redis is reconnecting (attempt ${this.retryCount})`);
		});

		this.client.on('error', (error) => {
			logger.error(`Redis error: ${error.message}`);
		});
	}

	public async connect(): Promise<void> {
		if (this.connecting) {
			logger.warn('Connection attempt already in progress');
			return;
		}

		try {
			this.connecting = true;
			await this.client.connect();
		} catch (error) {
			this.connecting = false;
			logger.error('Failed to connect to Redis:', error);
			throw error;
		}
	}

	public async disconnect(): Promise<void> {
		try {
			if (this.client.isReady && this.client.isOpen) {
				await this.client.disconnect();
				this.connecting = false;
			}
		} catch (error) {
			logger.error('Error disconnecting from Redis:', error);
			throw error;
		}
	}

	public getClient(): RedisClientType {
		return this.client;
	}
}

// Create a singleton instance
const redisConnection = new RedisConnection();

// Export the Redis client instance
export default redisConnection.getClient();

// Export connect method for explicit connection management
export const connectRedis = () => redisConnection.connect();

export const disconnectRedis = () => redisConnection.getClient().disconnect();
