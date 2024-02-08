import http from 'http';
import { app } from './app';
import { gracefulShutdown } from './lib/handlers/gracefulShutdown';
import { Logger } from '@/lib/logger';
import { config } from '@/lib/config';
import  {RedisCache} from './data/cache';
import { connect } from './data/database';
 
const logger = new Logger(__filename);
const server = http.createServer(app);

const cache = new RedisCache(config.redis.uri);

cache.connect().then(() => {
  logger.info('Cache connected');
}).catch((e) => {
  logger.error('Failed to establish Redis cache connection:', e);
});



const PORT = config.app.port;
try {
  server.listen(PORT, () => {
    logger.info(`Server instance instantiated and listening on port ${PORT}.`);
    connect().catch((e) => logger.error(e));
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} catch (error: any) {
  logger.error(`Error occurred while trying to start server: ${error.message}`);
}


// Handle graceful shutdown
process.on('SIGINT', async () => {
  await cache.disconnect();
  gracefulShutdown(server);
  process.exit();
});