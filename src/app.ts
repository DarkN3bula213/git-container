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
import sessionHandler from './lib/handlers/sessionHandler';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
/*---------------------------------------------------------*/
const logger = new Logger(__filename);
const app: Application = express();
 
app.use(
  cors({
    origin:
      'https://hps-admin.com',
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
const mongodbUri = config.isDocker ? config.mongo.docker : config.mongo.dev;

mongoose
  .connect(mongodbUri)
  .then(() =>
    logger.info({
      event: ': Session DB Connected',
    }),
  )
  .catch((err) =>
    logger.error({
      event: ': Session DB Connection Error',
      error: err,
    }),
  );

app.use(cookieParser());
app.use(RequestLogger);
app.use(apiKey);
app.use(morgan);
app.use(json(config.json));
app.use(urlencoded(config.urlEncoded));
// sessionHandler(app);
app.use(
  session({
    secret: 'vGj6GfsxRQf50DY0BK0MwC6B1fcJMfLJF4/ockgWth0=', // Ensure your secret is securely stored and not hard-coded
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: mongodbUri,
      collectionName: 'sessions',
    }),
    cookie: {
      httpOnly: true, // Prevents client-side JS from reading the token
      secure: true, // Ensures cookie is sent over HTTPS
      sameSite: 'none', // Important for cross-site access; use 'Strict' or 'Lax' for same-site scenarios
      maxAge: 2 * 60 * 60 * 1000, // Example: 24 hours
      domain: '.hps-admin.com', // Adjust the domain to match your site's domain
    },
  }),
);

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
