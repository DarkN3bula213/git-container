import { Logger } from '../logger';
import http from 'http';

const signals: ReadonlyArray<NodeJS.Signals> = ['SIGINT', 'SIGTERM'];
const logger = new Logger(__filename);

type Server = http.Server<
  typeof http.IncomingMessage,
  typeof http.ServerResponse
>;
export const gracefulShutdown = (server: Server) => {
  signals.forEach((signal) => {
    process.on(signal, () => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed. Exiting process now.');
        process.exit(0);
      });
    });
  });
};
