import type cors from 'cors';

// import { allowedOrigins, headers, methods } from '../constants/allowedOrigins';

export const options = {};

export const corsOptions: cors.CorsOptions = {
	origin: [
		'https://hps-admin.com',
		'http://localhost:5173',
		'http://192.168.100.149:5173'
	],
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
