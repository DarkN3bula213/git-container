import type cors from 'cors';
import { origins } from '../constants/allowedOrigins';
import { Logger } from '../logger/logger';
import { config } from './config';

const logger = new Logger(__filename);
export const options = {};

export const corsOptions: cors.CorsOptions = {
	origin: function (origin, callback) {
		if (
			origin &&
			origins[config.isProduction ? 'prod' : 'dev'].includes(origin)
		) {
			callback(null, true);
		} else {
			logger.warn(`CORS request blocked: ${origin}		`);
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
