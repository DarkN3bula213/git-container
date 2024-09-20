import { format } from 'date-fns';
// const logger = new Logger(__filename);
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import fs, { promises } from 'node:fs';
import path from 'node:path';

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
