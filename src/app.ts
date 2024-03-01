import express, { Application, json, urlencoded } from 'express';
import middleware from './middleware/common';
import cookieParser from 'cookie-parser';
import session from 'cookie-session';
import { morganMiddleware as morgan } from './lib/config';
import { NotFoundError } from './lib/api';
import { options } from './lib/config/cors';
import router from './routes';
import { errorHandler } from './lib/handlers/errorHandler';
import cors from 'cors';
import { config } from './lib/config';
import apiKey from './middleware/useApiKey';
import { RequestLogger } from './lib/logger';
const app: Application = express();

/*----------------------------------------------------------*/

app.use(cors({
    origin: ['https://hps-sialkot.ddns.net'],
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: 'x-access-token, x-refresh-token, Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key',
    credentials: true,
    optionsSuccessStatus: 204
}));
/*----------------------------------------------------------*/
app.use(cookieParser());
/*----------------------------------------------------------*/
app.use(RequestLogger);
/*----------------------------------------------------------*/
app.use(apiKey);
/*----------------------------------------------------------*/

app.use(morgan);
/*----------------------------------------------------------*/
app.use(json(config.json));
/*----------------------------------------------------------*/
app.use(urlencoded(config.urlEncoded));
/*----------------------------------------------------------*/

/*----------------------------------------------------------*/
app.use('/api', router);
/*----------------------------------------------------------*/
app.all('*', (req, res, next) => next(new NotFoundError()));
/*----------------------------------------------------------*/
app.use(errorHandler);
/*----------------------------------------------------------*/
export { app };
