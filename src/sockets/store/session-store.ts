// src/session/RedisSessionStore.ts
import { cache } from '@/data/cache/cache.service';
import { Logger } from '@/lib/logger';
import { convertToMilliseconds } from '@/lib/utils/fns';
import { RedisClientType } from 'redis';

interface Session {
	userId: string;
	username: string;
	timestamp?: number;
}

class RedisSessionStore {
	private redisClient: RedisClientType;
	private logger: Logger;

	constructor(redisClient: RedisClientType) {
		this.redisClient = redisClient;
		this.logger = new Logger(__filename);
	}

	async findSession(sessionId: string): Promise<Session | null> {
		this.logger.info(`Finding session with ID: ${sessionId}`);
		const sessionData = await this.redisClient.get(`session:${sessionId}`);
		return sessionData ? JSON.parse(sessionData) : null;
	}

	async saveSession(sessionId: string, session: Session): Promise<void> {
		session.timestamp = Date.now(); // Add timestamp to session
		const ttl = convertToMilliseconds('120m');
		this.logger.info(
			`Saving session with ID: ${sessionId} and TTL: ${ttl}`
		);
		await this.redisClient.set(
			`session:${sessionId}`,
			JSON.stringify(session),
			{ EX: convertToMilliseconds('120m') } // Set TTL for the session
		);
	}

	async deleteSession(sessionId: string): Promise<void> {
		this.logger.info(`Deleting session with ID: ${sessionId}`);
		await this.redisClient.del(`session:${sessionId}`);
	}
}

export const sessionStore = new RedisSessionStore(cache.getClient());
