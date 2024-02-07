import http from 'http';
import { app } from './app';
import { gracefulShutdown } from './lib/handlers/gracefulShutdown';
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);
const server = http.createServer(app);

gracefulShutdown(server);

try {
  server.listen(3000, () => {
    logger.info(`Server instance instantiated and listening on port 3000.`);
  });
} catch (error: any) {
  logger.error(`Error occurred while trying to start server: ${error.message}`);
}
