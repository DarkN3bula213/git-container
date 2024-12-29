import { config } from '@/lib/config';
import { ProductionLogger } from '@/lib/logger/v1/logger';
import { type RedisClientType, createClient } from 'redis';

const logger = new ProductionLogger(__filename);

const redisClient: RedisClientType = createClient({
	url: config.isDevelopment ? 'redis://localhost:6379' : process.env.REDIS_URL
});

redisClient.on('connect', () => logger.info('Cache is connecting'));
redisClient.on('ready', () => logger.info('Cache is ready'));
redisClient.on('end', () => logger.info('Cache disconnected'));
redisClient.on('reconnecting', () => logger.info('Cache is reconnecting'));
redisClient.on('error', (e) => logger.error(`Cache error: ${e.message}`));

export default redisClient;
