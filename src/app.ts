import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import { handleUploads } from './lib/config';
import handleErrors from './lib/handlers/errorHandler';
import hadnleRouting from './lib/handlers/route.handler';
import { Logger } from './lib/logger';
import handleMiddleware from './middleware/common';

/*---------------------------------------------------------*/
const logger = new Logger(__filename);

process.on('uncaughtException', (e) => {
  logger.error(`uncaughtException: ${e.message}`);
});
const app: Application = express();

handleMiddleware(app);
handleUploads(app);
hadnleRouting(app);
handleErrors(app);

export { app };
