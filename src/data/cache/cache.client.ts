import { createClient, type RedisClientType } from 'redis';
import { Logger } from '@/lib/logger';
import { config } from '@/lib/config';
const logger = new Logger(__filename);

const redisClient: RedisClientType = createClient({
  url: config.isDevelopment ? 'redis://localhost:6379' : process.env.REDIS_URL,
});

redisClient.on('connect', () => logger.info('Cache is connecting'));
redisClient.on('ready', () => logger.info('Cache is ready'));
redisClient.on('end', () => logger.info('Cache disconnected'));
redisClient.on('reconnecting', () => logger.info('Cache is reconnecting'));
redisClient.on('error', (error) => {
  logger.error(`Redis connection error: ${error.message}`);
  process.exit(1); // Consider exiting if Redis cannot connect, based on your app's requirements
});

export default redisClient;