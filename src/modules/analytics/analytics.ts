import { cache } from '@/data/cache/cache.service';
import type { NextFunction, Request, Response } from 'express';
import mongoose, { Document, Schema } from 'mongoose';

export const logActivity = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const start = process.hrtime();
	const sessionId = res.locals.sessionId;
	res.on('finish', async () => {
		const [seconds, nanoseconds] = process.hrtime(start);
		const durationInMilliseconds = seconds * 1000 + nanoseconds / 1e6;

		const logEntry = {
			timestamp: new Date(),
			method: req.method,
			url: req.originalUrl,
			status: res.statusCode,
			responseTime: durationInMilliseconds,
			ip: req.ip,
			userAgent: req.get('User-Agent')
		};

		// Store log entry in Redis under the session ID
		await cache.getClient().rPush(sessionId, JSON.stringify(logEntry));

		// Set an expiry for the session logs in Redis
		await cache.getClient().expire(sessionId, 2 * 60 * 60); // 2 hours
	});

	next();
};

interface GetRoute {
	endpoint: string;
	frequency: number;
	timestamps: Date[];
}

interface PostRoute {
	endpoint: string;
	frequency: number;
	timestamps: Date[];
}

interface UserActivityLog extends Document {
	userId: string;
	sessionId: string;
	startTime: Date;
	endTime: Date;
	duration: string;
	getRoutes: GetRoute[];
	postRoutes: PostRoute[];
}

const getRouteSchema = new Schema<GetRoute>({
	endpoint: { type: String, required: true },
	frequency: { type: Number, required: true },
	timestamps: { type: [Date], required: true }
});

const postRouteSchema = new Schema<PostRoute>({
	endpoint: { type: String, required: true },
	frequency: { type: Number, required: true },
	timestamps: { type: [Date], required: true }
});

const userActivityLogSchema = new Schema<UserActivityLog>({
	userId: { type: String, required: true },
	sessionId: { type: String, required: true },
	startTime: { type: Date, required: true },
	endTime: { type: Date, required: true },
	duration: { type: String, required: true },
	getRoutes: { type: [getRouteSchema], default: [] },
	postRoutes: { type: [postRouteSchema], default: [] }
});

const UserActivityLogModel = mongoose.model<UserActivityLog>(
	'UserActivityLog',
	userActivityLogSchema
);

export default UserActivityLogModel;
