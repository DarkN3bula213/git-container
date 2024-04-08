import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import { Logger } from '@/lib/logger';
import { config } from '@/lib/config';

const logger = new Logger(__filename);

class CacheClientService {
  private client: RedisClientType;

  constructor(private readonly options?: RedisClientOptions) {
    this.client = createClient({
      url: config.redis.uri,
    }); // Create client with merged options
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on('connect', () => logger.info('Cache is connecting'));
    this.client.on('ready', () => logger.info('Cache is ready'));
    this.client.on('end', () => logger.info('Cache disconnected'));
    this.client.on('reconnecting', () => logger.info('Cache is reconnecting'));
    this.client.on('error', (e) => logger.error('Cache error:', e));
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async get<T>(key: string, fetchFunction: () => Promise<T>): Promise<T> {
    try {
      const cachedData = await this.client.get(key);
      if (cachedData) {
        logger.debug('Data fetched from cache');
        return JSON.parse(cachedData);
      }

      logger.debug('Data not in cache - fetching from source');
      const freshData = await fetchFunction();
      await this.client.pSetEx(key, 60000, JSON.stringify(freshData)); // Cache with expiration (60 seconds)
      return freshData;
    } catch (error) {
      logger.error('Error in CacheClientService:', error);
      throw error; // Re-throw to allow for error handling where used
    }
  }
}

export const cache = new CacheClientService();
