// import type { NextFunction, Request, Response } from 'express';
// import fs from 'node:fs';
// import path from 'node:path';
// import winston from 'winston';
// import { config } from '../config';

// let dir = config.log.directory;
// if (!dir) dir = path.resolve('logs');
// if (!fs.existsSync(dir)) {
// 	fs.mkdirSync(dir);
// }
// export const PathLogger = winston.createLogger({
// 	level: 'info',
// 	format: winston.format.combine(
// 		winston.format.timestamp(),
// 		winston.format.json()
// 	),
// 	transports: [
// 		new winston.transports.DailyRotateFile({
// 			filename: path.join(dir, 'path-%DATE%.log'),
// 			dirname: dir,
// 			datePattern: 'YYYY-MM-DD',
// 			zippedArchive: true,
// 			maxSize: '20m',
// 			maxFiles: '14d'
// 		})
// 	]
// });

// export const PathLoggerMiddleware = (
// 	req: Request,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	const originalJson = res.json;
// 	const originalSend = res.send;
// 	// Capture the start time
// 	const start = Date.now();

// 	res.json = function (data) {
// 		return handleResponse(this, data, originalJson);
// 	};

// 	res.send = function (data) {
// 		return handleResponse(this, data, originalSend);
// 	};
// 	// const originalEnd = res.end;
// 	function handleResponse(
// 		response: Response,
// 		data: any,
// 		originalFn: (body: any) => Response
// 	) {
// 		const statusCode = response.statusCode || 200;
// 		PathLogger.info('Route accessed', {
// 			path: req.originalUrl,
// 			method: req.method,
// 			statusCode,
// 			responseTime: `${Date.now() - start}ms`
// 		});
// 		return originalFn.call(response, data);
// 	}
// 	next();
// };
