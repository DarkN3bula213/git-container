import type cors from 'cors';
import { allowedOrigins } from '../constants/allowedOrigins';
import { Logger } from '../logger';

const logger = new Logger(__filename);
export const options = {};

export const corsOptions: cors.CorsOptions = {
	// origin: [
	// 	'https://hps-admin.com',
	// 	'http://localhost:5173',
	// 	'https://localhost:5173',
	// 	'http://192.168.100.149:5173',
	// 	'http://192.168.100.86:5173',
	// 	'http://localhost:3030'
	// ],
	origin: function (origin, callback) {
		// logger.info({
		// 	message: 'CORS request',
		// 	origin: origin
		// });
		if (origin && allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			logger.warn({
				message: 'CORS request blocked',
				origin: origin
			});
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
