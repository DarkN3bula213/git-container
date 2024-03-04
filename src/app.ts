import express, { Application, json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { morganMiddleware as morgan } from './lib/config';
import { NotFoundError } from './lib/api';
import router from './routes';
import { errorHandler } from './lib/handlers/errorHandler';
import cors from 'cors';
import { config } from './lib/config';
import apiKey from './middleware/useApiKey';
import { Logger, RequestLogger } from './lib/logger';
import helmet from 'helmet'
import compression from 'compression'
import { loginLimiter, options } from './lib/config/rate-limit';
/*---------------------------------------------------------*/
const logger = new Logger(__filename);
const app: Application = express();
 
app.use(
  cors({
    origin: config.origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'x-api-key',
      'Authorization',
      'x-access-token',
      'X-Api-Key',
    ],
    exposedHeaders: ['Set-Cookie'],
  }),
);

app.use(cookieParser());
app.use(RequestLogger);
app.use(apiKey);
app.use(morgan);
app.use(json(config.json));
app.use(urlencoded(config.urlEncoded));
app.use(loginLimiter);
// app.use(helmet());
app.use(compression());

app.use('/api', router);
app.all('*', (req, res, next) => next(new NotFoundError()));
app.use(errorHandler);

export { app };
