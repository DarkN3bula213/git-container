import express, { Application, json, urlencoded } from 'express';
import middleware from './middleware/common';

import { morganMiddleware as morgan } from './lib/config';
import { NotFoundError } from './lib/api';
import { corsOptions } from './lib/config/cors';
import router from './routes';
import { errorHandler } from './lib/handlers/errorHandler';
import cors from 'cors';
import { config } from './lib/config';
import apiKey from './middleware/useApiKey';
const app: Application = express();

/*----------------------------------------------------------*/
app.use(cors(config.cors));
/*----------------------------------------------------------*/
app.use(apiKey);
/*----------------------------------------------------------*/
app.use(morgan);
/*----------------------------------------------------------*/
app.use(json(config.json));
/*----------------------------------------------------------*/
app.use(urlencoded(config.urlEncoded));
/*----------------------------------------------------------*/
app.get('/test', (req, res) => res.send('Test route'));
/*----------------------------------------------------------*/
app.use('/api', router);
/*----------------------------------------------------------*/
app.all('*', (req, res, next) => next(new NotFoundError()));
/*----------------------------------------------------------*/
app.use(errorHandler);
/*----------------------------------------------------------*/
export { app };
