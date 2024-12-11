import { convertToMilliseconds } from '@/lib/utils/fns';
import { NextFunction, Request, Response } from 'express';
import rateLimit, {
	Options,
	RateLimitRequestHandler
} from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later.',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for sensitive routes (like auth)
export const authLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 5, // Limit each IP to 5 requests per windowMs
	message: 'Too many login attempts, please try again after an hour.',
	standardHeaders: true,
	legacyHeaders: false
});

// Custom rate limiter factory
export const createRateLimiter = (
	windowMs: number,
	max: number,
	message: string
): RateLimitRequestHandler => {
	const options: Partial<Options> = {
		windowMs,
		max,
		message,
		standardHeaders: true,
		legacyHeaders: false
	};

	return rateLimit(options);
};

const signUpLimiter = rateLimit({
	windowMs: convertToMilliseconds('1hr'),
	max: 5,
	message: 'Too many sign up attempts, please try again after an hour.',
	standardHeaders: true,
	legacyHeaders: false,
	// You can add skip conditions if needed
	skip: (_req: Request) => {
		// Example: skip if request has certain header or condition
		// return req.headers['skip-limit'] === 'true';
		return false;
	}
});

export const limitRequest = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	signUpLimiter(req, res, next);
};
