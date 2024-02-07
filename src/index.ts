import http from 'http';
import { app } from './app';
import { gracefulShutdown } from './lib/handlers/gracefulShutdown';
import { Logger } from '@/lib/logger';
import { config } from '@/lib/config';
import client from './data/cache';
import {ConnectionManager,terminateGracefully,backOffStrategy} from './data/database';


const logger = new Logger(__filename);
const server = http.createServer(app);

gracefulShutdown(server);

const PORT = config.app.port;
try {
  server.listen(PORT, () => {
    logger.info(`Server instance instantiated and listening on port ${PORT}.`);
    client.on('error', (e) => logger.error(e));
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} catch (error: any) {
  logger.error(`Error occurred while trying to start server: ${error.message}`);
}
 