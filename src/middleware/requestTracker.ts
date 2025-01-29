import { cache } from '@/data/cache/cache.service';
import { config } from '@/lib/config';
import { User } from '@/modules/auth/users/user.model';
import { RequestTrackerService } from '@/services/request-tracker';
import { Application, NextFunction, Request, Response } from 'express';

const requestTracker = new RequestTrackerService(cache);

export const trackRequest = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	// Capture original end to ensure we get final status code
	const originalEnd = res.end;

	res.end = function (chunk?: any, encoding?: any, callback?: any) {
		const user = req.user as User;
		// Track request after response is finished
		let userId = 'anonymous';
		if (user) {
			userId = user._id.toString();
		}
		setImmediate(() => {
			requestTracker.trackRequest(
				userId,
				req.path,
				req.method,
				res.statusCode
			);
		});

		// Call original end
		return originalEnd.call(this, chunk, encoding, callback);
	};

	next();
};

export const nonProductionMiddleware = (app: Application) => {
	if (!config.isProduction || !config.isTest) {
		app.use(trackRequest);
	}
};
