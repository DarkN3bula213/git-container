import { cache } from '@/data/cache/cache.service';
import { Key } from '@/data/cache/keys';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { socketParser } from '@/sockets';

import { NextFunction, Request, Response } from 'express';

const broadcast = (eventName: string, getMessage: any) => {
	return (req: Request, res: Response, next: NextFunction) => {
		res.on('finish', async () => {
			try {
				// Await the message if it's a promise (for async work)
				const message = await Promise.resolve(getMessage(req, res));

				// Broadcast the event and message to all clients
				socketParser.emit(eventName, message);

				console.log(`Successfully broadcasted event: ${eventName}`);
			} catch (error) {
				console.error(`Error broadcasting event ${eventName}:`, error);
			}
		});

		// Proceed to the next middleware/route handler
		next();
	};
};

export default broadcast;
export const notifyRevenueChange = asyncHandler(
	async (_req: Request, _res: Response, _next: NextFunction) => {
		const key = Key.DAILYTOTAL;
		const totalAmount = await cache.get<number>(key);

		return {
			message: `Total revenue for today changed to $${totalAmount}`,
			timestamp: new Date().toISOString()
		};
	}
);
export const broadcastRevenueChange = async (
	_req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const key = Key.DAILYTOTAL;
		const totalAmount = await cache.get<number>(key);

		socketParser.emit('notification', {
			message: `Total revenue for today changed to $${totalAmount}`,
			timestamp: new Date().toISOString()
		});

		// Continue with the next middleware or response
		next();
	} catch (error) {
		console.error('Error broadcasting revenue change:', error);
		res.status(500).send('Failed to broadcast revenue change.');
	}
};
export const broadcastOnResponseFinish = (
	event: string,
	generateMessage: (req: Request, res: Response) => Promise<any>
) => {
	return (req: Request, res: Response, next: NextFunction) => {
		res.on('finish', async () => {
			try {
				// Fetch the necessary data (e.g., total revenue) from cache or other sources
				const message = await generateMessage(req, res);

				// Broadcast the event and the generated message
				socketParser.emit(event, message);
				console.log(`Broadcasted ${event} with data:`, message);
			} catch (error) {
				console.error('Error broadcasting on response finish:', error);
			}
		});

		next(); // Continue with the next middleware or route handler
	};
};
