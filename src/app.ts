import { cache } from '@/data/cache/cache.service';
import { loginLimiter, morganMiddleware as morgan } from '@/lib/config';
import { corsOptions } from '@/lib/config/cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, json, urlencoded } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { handleUploads } from './lib/config';
import { config } from './lib/config/config';
import handleErrors from './lib/handlers/errorHandler';
import { Logger } from './lib/logger';
// import setupMonitoring from './middleware/monitoring.middleware';
import { nonProductionMiddleware } from './middleware/requestTracker';
import sanitizeInputs from './middleware/sanitizeReq';
import apiKey from './middleware/useApiKey';
import router from './routes';

const logger = new Logger(__filename);

process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
	logger.error('Uncaught Exception:', error);
	// Optionally, exit the process after logging
	// setTimeout(() => process.exit(1), 100);
});
const app: Express = express();

app.set('trust proxy', 1);
// setupMonitoring(app);
app.use(cookieParser());
app.use(helmet());
app.use(compression());
app.use(hpp());
app.use(sanitizeInputs);
app.use(cors(corsOptions));
app.use(morgan);
// app.use(RequestLogger);
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
