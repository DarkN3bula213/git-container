import express, { type Application, Request, Response } from 'express';

import { handleUploads } from './lib/config';
import handleErrors from './lib/handlers/errorHandler';
import { Logger } from './lib/logger';
import middleware from './middleware/common';
import router from './routes';

const logger = new Logger(__filename);

process.on('uncaughtException', (e) => {
	logger.error({
		event: 'Uncaught Exception',
		message: e.message,
		stack: e.stack
	});
});

process.on('unhandledRejection', (reason, promise) => {
	logger.error({
		event: 'Unhandled Rejection Occured',
		reason: reason,
		promise: promise
	});
	console.error(`Reason: ${reason}`);
	console.dir(promise);
});
const app: Application = express();
export function onlyForHandshake(
	middleware: (req: Request, res: Response, next: any) => void
) {
	return (
		req: Request & { _query: Record<string, string> },
		res: Response,
		next: (err?: Error) => void
	) => {
		const isHandshake = req._query.sid === undefined;
		if (isHandshake) {
			middleware(req, res, next);
		} else {
			next();
		}
	};
}
/*
 *
 *
 *
 */ /** -----------------------------( Archieved )->*/

middleware(app);
handleUploads(app);
app.use('/api', router);

handleErrors(app);

export { app };
