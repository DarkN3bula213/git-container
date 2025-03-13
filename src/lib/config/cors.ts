import type cors from 'cors';
import { origins } from '../constants/allowedOrigins';
import { Logger } from '../logger/logger';
import { config } from './config';

const logger = new Logger(__filename);
export const options = {};

export const corsOptions: cors.CorsOptions = {
	origin: function (origin, callback) {
		if (!origin) {
			// Same-origin request or non-browser client
			// logger.info('Request from same origin or non-browser client');
			callback(null, true);
			return;
		}

		const allowedOriginsList =
			origins[config.isProduction ? 'prod' : 'dev'];
		if (allowedOriginsList.includes(origin)) {
			callback(null, true);
		} else {
			logger.warn(
				`CORS request blocked - Origin: ${origin} not in allowed list: ${JSON.stringify(allowedOriginsList)}`
			);
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
	// preflightContinue: true,
	optionsSuccessStatus: 204,
	methods: ['GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'],
	allowedHeaders: [
		'Content-Type',
		'x-api-key',
		'Authorization',
		'x-access-token'
	],
	exposedHeaders: ['Set-Cookie']
};
