import { Logger } from '@/lib/logger';
import type { RedisClientType } from 'redis';
import redisClient from './cache.client';
const logger = new Logger(__filename);

export interface CacheService {
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  del(key: string): Promise<void>;
}
interface SessionUser {
  id: string;
  username: string;
  isPremium: boolean;
}

// Define an interface for the session data structure
interface SessionData {
  user: SessionUser;
}

class CacheClientService {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  disconnect(): void {
    this.client.disconnect();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async get<T>(key: string, fetchFunction: () => Promise<T>): Promise<T> {
    const cachedData = await this.client.get(key);
    if (cachedData) {
      logger.debug('Data fetched from cache');
      return JSON.parse(cachedData);
    }

    logger.debug('Data not in cache - fetching from source');
    const freshData = await fetchFunction();
    await this.client.setEx(key, 60000, JSON.stringify(freshData)); // Assuming 60 seconds expiration for demonstration
    return freshData;
  }

  // Session management methods
  async saveSession(
    sessionId: string,
    sessionData: object,
    ttl = 86400,
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
