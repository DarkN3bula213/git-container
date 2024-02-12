import http from 'http';
import { app } from './app';

import { Logger } from '@/lib/logger';
import { config } from '@/lib/config';
import './data/cache';
import { db } from './data/database';
import { signals } from './lib/constants';

const logger = new Logger(__filename);
const server = http.createServer(app);

const PORT = config.app.port;
logger.debug({
  'Server port': PORT,
  'Database name': config.mongo.uri,
})
const startServer = async () => {
  try {
    await db.connect().then(() => {
      server.listen(PORT, () => {
        logger.info(
          `Server instance instantiated and listening on port ${PORT}.`,
        );
      });
    });
    // await cache.connect();
  } catch (error: any) {
    logger.error(
      `Error occurred while trying to start server: ${error.message}`,
    );
  }
};

startServer();

signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.debug(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.debug('Server closed. Exiting process now.');
      process.exit(0);
    });
    // await cache.disconnect().then(() => logger.debug('Cache disconnected'));
    await db.disconnect().then(() => logger.debug('Database disconnected'));
  });
});
