import { format } from 'date-fns';
// const logger = new ProductionLogger(__filename);
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import fs, { promises } from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import { config } from '../config';

type LogEventProps = {
	message: string;
	logFileName: string;
};

async function logEvents({ message, logFileName }: LogEventProps) {
	const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss');
	const logItem = `${dateTime}\t${randomUUID({
		disableEntropyCache: true
	})}\t${message}\n`;

	let dir = config.log.directory;
	if (!dir) dir = path.resolve('logs');
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	await promises.appendFile(path.join(dir, logFileName), logItem);
}

export async function RequestLogger(
	req: Request,
	_res: Response,
	next: NextFunction
) {
	logEvents({
		message: `${req.method}\t${req.url}\t${req.headers.origin}`,
		logFileName: 'request.log'
	});
	next();
}
export const PathLogger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({
			filename: path.join(__dirname, '../../../logs/path.log'),
			dirname: path.join(__dirname, '../../../logs')
		})
	]
});

export const PathLoggerMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const originalJson = res.json;
	const originalSend = res.send;
	// Capture the start time
	const start = Date.now();

	res.json = function (data) {
		return handleResponse(this, data, originalJson);
	};

	res.send = function (data) {
		return handleResponse(this, data, originalSend);
	};
	// const originalEnd = res.end;
	function handleResponse(
		response: Response,
		data: any,
		originalFn: (body: any) => Response
	) {
		const statusCode = response.statusCode || 200;
		PathLogger.info('Route accessed', {
			path: req.originalUrl,
			method: req.method,
			statusCode,
			responseTime: `${Date.now() - start}ms`
		});
		return originalFn.call(response, data);
	}
	next();
};
