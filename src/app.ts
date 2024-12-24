import { cache } from '@/data/cache/cache.service';
import { config, loginLimiter, morganMiddleware as morgan } from '@/lib/config';
import { corsOptions } from '@/lib/config/cors';
import { RequestLogger } from '@/lib/logger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application, json, urlencoded } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { handleUploads } from './lib/config';
import handleErrors from './lib/handlers/errorHandler';
import { Logger } from './lib/logger';
import { nonProductionMiddleware } from './middleware/requestTracker';
import sanitizeInputs from './middleware/sanitizeReq';
import apiKey from './middleware/useApiKey';
import router from './routes';

const logger = new Logger(__filename);

process.on('uncaughtException', (e) => {
	logger.error({
		event: 'Uncaught Exception',
		message: e.message,
		stack: e.stack
	});
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('unhandledRejection', (reason: any, promise) => {
	logger.error({
		event: 'Unhandled Rejection Occurred',
		error: {
			message: reason?.message,
			stack: reason?.stack,
			name: reason?.name
		},
		promise: promise
	});
});
const app: Application = express();

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(helmet());
app.use(compression());
app.use(hpp());
app.use(sanitizeInputs);
app.use(cors(corsOptions));
app.use(morgan);
app.use(RequestLogger);
app.use(urlencoded(config.urlEncoded));
app.use(json(config.json));
app.use(cache.cachedSession(config.tokens.jwtSecret));
app.use(apiKey);
app.use(loginLimiter);
nonProductionMiddleware(app);
handleUploads(app);
app.use('/api', router);

handleErrors(app);

export { app };
