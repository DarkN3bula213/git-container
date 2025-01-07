// src/session/RedisSessionStore.ts
import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { Logger } from '@/lib/logger';
import { convertToSeconds } from '@/lib/utils/fns';
import { RedisClientType } from 'redis';

interface Session {
	userId: string;
	username: string;
	timestamp?: number;
}

class RedisSessionStore {
	private readonly redisClient: RedisClientType;
	private readonly logger: Logger;

	constructor(redisClient: RedisClientType) {
		this.redisClient = redisClient;
		this.logger = new Logger(__filename);
	}

	async findSession(sessionId: string): Promise<Session | null> {
		// this.logger.info(`Finding session with ID: ${sessionId}`);
		const key = getDynamicKey(DynamicKey.SESSION, sessionId);
		const sessionData = await this.redisClient.get(key);
		return sessionData ? JSON.parse(sessionData) : null;
	}

	async saveSession(sessionId: string, session: Session): Promise<void> {
		session.timestamp = Date.now(); // Add timestamp to session
		const ttl = convertToSeconds('120m');
		const key = getDynamicKey(DynamicKey.SESSION, sessionId);
		// this.logger.info(`Saving session with ID: ${sessionId} and TTL: ${ttl}`);
		await this.redisClient.set(key, JSON.stringify(session), {
			EX: ttl
		});
	}

	async deleteSession(sessionId: string): Promise<void> {
		const key = getDynamicKey(DynamicKey.SESSION, sessionId);
		// this.logger.info(`Deleting session with ID: ${sessionId}`);
		await this.redisClient.del(key);
	}
}

export const sessionStore = new RedisSessionStore(cache.getClient());
