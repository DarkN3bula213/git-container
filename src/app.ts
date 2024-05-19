import express, { type Application } from 'express';
import { handleUploads } from './lib/config';
import handleErrors from './lib/handlers/errorHandler';
import { Logger } from './lib/logger';
import handleMiddleware from './middleware/common';
import { monitor } from './modules/analytics/analytics';
import router from './routes';
/*---------------------------------------------------------*/
const logger = new Logger(__filename);

process.on('uncaughtException', (e) => {
  logger.error(`uncaughtException: ${e.message}`);
});
const app: Application = express();

monitor(app);
handleMiddleware(app);
handleUploads(app);
app.use('/api', router);
handleErrors(app);

export { app };
