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

/*---------------------------------------------------------*/
const logger = new Logger(__filename);
const app: Application = express();
// app.use((req, res, next) => {
//   console.log(req.headers); // Log all incoming headers
//   next();
// });
// const allowedOrigins = [
//   'https://hps-admin.com',
//   'https://5173-darkn3bula2-cracachedhp-ttkt14e4rit.ws-us108.gitpod.io',
// ];
app.use((req, res, next) => {
  try {
    logger.info({
      event: 'Request',
      origin: req.headers.origin,
    });
  } catch (error) {
    next();
  }
  next();
});
app.use(
  cors({
    // origin: (origin, callback) => {
    //   if (origin === undefined || allowedOrigins.includes(origin)) {
    //    logger.info({event: 'Cors origin', origin})
    //     callback(null, true);
    //   } else {
    //     logger.info({event: 'Cors origin requiring cb', origin})
    //     console.log('Access-Control-Allow-Origin: ', origin);
    //     callback(new Error('Not allowed by CORS'));
    //   }
    // },
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'x-api-key',
      'Authorization',
      'x-access-token',
      'x-refresh-token',
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
app.use('/api', router);
app.all('*', (req, res, next) => next(new NotFoundError()));
app.use(errorHandler);
/*----------------------------------------------------------*/

/*----------------------------------------------------------*/
/*----------------------------------------------------------*/
/*----------------------------------------------------------*/

/*----------------------------------------------------------*/
/*----------------------------------------------------------*/
/*----------------------------------------------------------*/

/*----------------------------------------------------------*/
/*----------------------------------------------------------*/
/*----------------------------------------------------------*/
/*----------------------------------------------------------*/
export { app };
