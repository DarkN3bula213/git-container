import rateLimit from 'express-rate-limit';
import { ProductionLogger } from '../logger/v1/logger';

const logger = new ProductionLogger(__filename);

export const options = {
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message:
		'Too many requests from this IP, please try again after 15 minutes',

	headers: true
};

export const loginLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 25,
	message: {
		message:
			'Too many login attempts from this IP, please try again after a 60 second pause'
	},
	handler: (_req, res, _next, options) => {
		logger.info(options.message);
		res.status(options.statusCode).send(options.message);
	},
	standardHeaders: true,
	legacyHeaders: false
});
