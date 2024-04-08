import http from 'http';
import { app } from './app';
import { Logger } from '@/lib/logger';
import { config } from '@/lib/config';
// import './data/cache';
import { db } from './data/database';
import { signals } from './lib/constants';
import SocketService from './sockets';

const logger = new Logger(__filename);
const server = http.createServer(app);
new SocketService(server);

const PORT = config.app.port;
import fs from 'fs-extra';
import path from 'path';
 

const createDirectories = async () => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    const imagesDir = path.join(__dirname, '..', 'uploads/images');
    const documentsDir = path.join(__dirname, '..', 'uploads/documents');
    // fs-extra's ensureDir function checks if a directory exists, and creates it if it doesn't
    await fs.ensureDir(uploadsDir);
    await fs.ensureDir(imagesDir);
    await fs.ensureDir(documentsDir);

    logger.info('Ensured that upload directories exist.');
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Type-guard check
      logger.error(
        `Error occurred while trying to start server: ${error.message}`,
      );
    } else {
      logger.error(
        `An unexpected error occurred while trying to start the server.`,
      );
    }
  }
};

// Call this function at the start of your application, before starting your server
createDirectories().then(() => {
  startServer();
});

const startServer = async () => {
 
  try {
    await db.connect().then(() => {
      server.listen(PORT, () => {
        logger.info({
          server: `Server instance instantiated and listening on port ${PORT}.`,
          node: process.env.NODE_ENV,
        });
      });
    });
  } catch (error: any) {
    logger.error(
      `Error occurred while trying to start server: ${error.message}`,
    );
  }
};

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
