import { config } from '@/lib/config/config';
import { Logger } from '@/lib/logger';
import { convertToMilliseconds } from '@/lib/utils/fns';
import RedisStore from 'connect-redis';
import session from 'express-session';
import { RedisClientType } from 'redis';
import redisClient from './cache.client';

const logger = new Logger(__filename);

export interface CacheService {
	set(key: string, value: any): Promise<void>;
	get<T>(key: string): Promise<T | null>;
	del(key: string): Promise<void>;
	setExp(key: string, value: any, seconds: number): Promise<void>;
	delPattern(pattern: string): Promise<void>;
	incrBy(key: string, increment: number): Promise<number>;
	decrBy(key: string, decrement: number): Promise<number>;
}
// cache.service.ts

export class CacheClientService {
	private readonly client: RedisClientType;

	constructor(client: RedisClientType) {
		this.client = client;
	}

	// async connect(): Promise<void> {
	// 	await this.client.connect();
	// }

	// disconnect(): void {
	// 	this.client.disconnect();
	// }

	getClient(): RedisClientType {
		return this.client;
	}

	async get<T>(key: string): Promise<T | null> {
		const cachedData = await this.client.get(key);
		return cachedData ? JSON.parse(cachedData) : null;
	}

	async set(key: string, value: any): Promise<void> {
		await this.client.set(key, JSON.stringify(value));
	}

	async setExp(key: string, value: any, seconds: number): Promise<void> {
		await this.client.setEx(key, seconds, JSON.stringify(value));
	}

	async del(key: string): Promise<void> {
		await this.client.del(key);
	}

	async delPattern(pattern: string): Promise<void> {
		const keys = await this.client.keys(pattern);
		if (keys.length) {
			await this.client.del(keys);
		}
	}
	// Increment a value by a specific number (used for adding money flow)
	async incrBy(key: string, increment: number): Promise<number> {
		const result = await this.client.incrBy(key, increment);
		return result;
	}

	// Decrement a value by a specific number (used for removing money flow)
	async decrBy(key: string, decrement: number): Promise<number> {
		const result = await this.client.decrBy(key, decrement);
		return result;
	}
	cachedSession(secret: string) {
		const RedisSessionStore = new RedisStore({
			client: this.client,
			prefix: 'cached:',
			ttl: 30000
		});

		return session({
			store: RedisSessionStore,
			secret: secret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: config.isProduction, // Use secure cookies in production
				maxAge: convertToMilliseconds('120m')
			}
		});
	}
	async getWithFallback<T>(
		key: string,
		fetchFunction: () => Promise<T>,
		ttl: number = 60000
	): Promise<T> {
		const cachedData = await this.get<T>(key);
		if (cachedData) {
			logger.debug(`Data in cache for key: ${key}`);
			return cachedData;
		}

		logger.debug(`Data not in cache for key: ${key}`);
		const freshData = await fetchFunction();

		// if the data is an array and has length then set the cache
		if (Array.isArray(freshData) && freshData.length > 0) {
			await this.setExp(key, freshData, ttl);
		}
		return freshData;
	}

	// Session management methods
	async saveSession(
		sessionId: string,
		sessionData: object,
		ttl: number = 86400
	): Promise<void> {
		await this.client.setEx(sessionId, ttl, JSON.stringify(sessionData));
	}

	async getSession(sessionId: string): Promise<SessionData | null> {
		const session = await this.client.get(sessionId);
		return session ? JSON.parse(session) : null;
	}

	async deleteSession(sessionId: string): Promise<void> {
		await this.client.del(sessionId);
	}
}

export const cache = new CacheClientService(redisClient);

interface SessionUser {
	id: string;
	username: string;
	isPremium: boolean;
}

// Define an interface for the session data structure
interface SessionData {
	user: SessionUser;
}
