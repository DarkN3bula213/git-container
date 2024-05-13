import express, {
  Application,
  json,
  urlencoded,
 
} from 'express';
import cookieParser from 'cookie-parser';
import { morganMiddleware as morgan ,config,loginLimiter,handleUploads} from './lib/config';
import { NotFoundError } from './lib/api';
import router from './routes';
import { errorHandler } from './lib/handlers/errorHandler';
import cors from 'cors';
 
import apiKey from './middleware/useApiKey';
import { Logger, RequestLogger } from './lib/logger';
import helmet from 'helmet';
import compression from 'compression';
import sanitize from 'express-mongo-sanitize';
 
import { monitor } from './modules/analytics/analytics';
 
import hpp from 'hpp';
import {  sessionOptions } from './lib/handlers/sessionHandler';
import session from 'express-session';
/*---------------------------------------------------------*/

process.on('uncaughtException', (e) => {
  logger.error(`uncaughtException: ${e.message}`);
});
const logger = new Logger(__filename);
const app: Application = express();
app.set('trust proxy', 1);
monitor(app);
app.use(
  cors({
    origin: 'https://hps-admin.com',
    credentials: true,
    optionsSuccessStatus: 204,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'x-api-key',
      'Authorization',
      'x-access-token',
    ],
    exposedHeaders: ['Set-Cookie'],
  }),
);
app.use(cookieParser());
app.use(RequestLogger);
app.use(morgan);
app.use(hpp());
handleUploads(app);

app.use(apiKey);
app.use(urlencoded(config.urlEncoded));
app.use(json(config.json));
app.use(sanitize());
app.use(loginLimiter);
app.use(helmet());
app.use(session(sessionOptions));
app.use(compression());
app.use('/api', router);
app.all('*', (req, res, next) => next(new NotFoundError()));
app.use(errorHandler);

export { app };
