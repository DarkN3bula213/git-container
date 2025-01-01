import fs from 'node:fs';
// import path from 'node:path';
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LokiTransport from 'winston-loki';
import { config } from '../config';
import { logDirectory, logLevel } from './loggerConfig';
import { customPrintf, customTimestampFormat } from './loggerFormats';

if (!fs.existsSync(logDirectory)) {
	fs.mkdirSync(logDirectory);
}

export const consoleTransport = new winston.transports.Console();

export const dailyRotateFileTransport = new DailyRotateFile({
	level: logLevel,
	filename: `${logDirectory}/%DATE%.log`,
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	handleExceptions: true,
	maxSize: '20m',
	maxFiles: '14d',
	format: format.combine(
		customTimestampFormat,
		format.errors({ stack: true }),
		format.prettyPrint(),
		format.align()
	)
});

export const devTransport = new winston.transports.Console({
	format: format.combine(
		customTimestampFormat,

		format.colorize(),
		customPrintf
	)
});

export const lokiTransport = new LokiTransport({
	host: config.production ? 'http://loki:3100' : 'http://localhost:3100',
	labels: {
		service: 'app',
		environment: config.production ? 'prod' : 'dev'
	}
});
