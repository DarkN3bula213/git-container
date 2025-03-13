import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import colors from 'colors';
import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/config';
import { formatObject } from './loggerFormats';

// Configure log directory
const logDir = (() => {
	const defaultDir = path.resolve(process.cwd(), 'logs');
	try {
		return config?.log?.directory || defaultDir;
	} catch {
		return defaultDir;
	}
})();

// Ensure log directory exists
fs.mkdirSync(logDir, { recursive: true });

// Determine log level
const logLevel = (() => {
	try {
		return config?.isProduction ? 'info' : 'debug';
	} catch {
		return 'debug';
	}
})();

// Custom color scheme using 'colors'
const getColor = (level: string) => {
	switch (level) {
		case 'error':
			return colors.red;
		case 'warn':
			return colors.yellow;
		case 'info':
			return colors.cyan;
		case 'debug':
			return colors.blue;
		default:
			return colors.white;
	}
};

// Custom timestamp format
const getFormattedTimestamp = () => {
	const timestamp =
		new Date().toLocaleString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: 'numeric',
			hour12: false,
			timeZone: 'Asia/Karachi'
		}) + `.${new Date().getMilliseconds().toString().padStart(3, '0')}`;
	return colors.gray(`| + | ${timestamp}`);
};

// Console formatter for development
const consoleFormat = winston.format.combine(
	winston.format.errors({ stack: false }),
	winston.format.timestamp(),
	winston.format.printf((info) => {
		const color = getColor(info.level);
		const level = color(info.level.toUpperCase());
		const timestamp = getFormattedTimestamp();
		const scope =
			config.showScope && info.scope
				? colors.cyan(
						` [${path.basename(path.dirname(info.scope))}/${path.basename(info.scope)}]`
					)
				: '';

		let message = info.message;

		if (typeof message === 'object') {
			message = formatObject(info.scope, message);
		}
		// const stack = info.stack ? `\n${colors.gray(info.stack)}` : '';
		return `${timestamp} [${level}]${scope}: ${colors.bgBlack(colors.white(message))}`;
	})
);

// File formatter for production
const fileFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.errors({ stack: true }),
	winston.format.json()
);

const getLogtailTransport = () => {
	const logtail = new Logtail(config.log.logtail, {
		endpoint: 'https://s1203342.eu-nbg-2.betterstackdata.com'
	});
	return new LogtailTransport(logtail);
};
// Transport configurations
const transports = [
	new winston.transports.Console({
		format: consoleFormat,
		handleExceptions: true,
		handleRejections: true
	}),
	new DailyRotateFile({
		dirname: logDir,
		filename: 'app-%DATE%.log',
		datePattern: 'YYYY-MM-DD',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '14d',
		format: fileFormat
	}),
	getLogtailTransport()
];

// Create base logger
const logger = winston.createLogger({
	level: logLevel,
	transports,
	exceptionHandlers: [
		new DailyRotateFile({
			dirname: logDir,
			filename: 'exceptions-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '14d',
			format: fileFormat
		})
		// new winston.transports.Console({ format: consoleFormat })
	],
	rejectionHandlers: [
		new DailyRotateFile({
			dirname: logDir,
			filename: 'rejections-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '14d',
			format: fileFormat
		})
		// new winston.transports.Console({ format: consoleFormat })
	],
	exitOnError: false
});

// Logger class wrapper for scoping
export class Logger {
	private static DEFAULT_SCOPE = 'app';
	private logger: winston.Logger;

	constructor(scope?: string) {
		this.logger = logger.child({
			scope: scope || Logger.DEFAULT_SCOPE
		});
	}

	public debug(message: string | Record<string, unknown>, ...meta: any[]) {
		this.log('debug', message, meta);
	}

	public info(message: string | Record<string, unknown>, ...meta: any[]) {
		this.log('info', message, meta);
	}

	public warn(message: string | Record<string, unknown>, ...meta: any[]) {
		this.log('warn', message, meta);
	}

	public error(
		message: string | Error | Record<string, unknown>,
		...meta: any[]
	) {
		if (message instanceof Error) {
			this.log('error', message.message, [...meta, { stack: undefined }]);
		} else {
			this.log('error', message, meta);
		}
	}

	private log(
		level: string,
		message: string | Record<string, unknown>,
		meta: any[]
	) {
		if (typeof message === 'object' && message !== null) {
			const formattedMessage = formatObject(
				this.logger.defaultMeta?.scope as string,
				message
			);
			this.logger.log(level, formattedMessage);
		} else {
			this.logger.log(level, message, ...meta);
		}
	}
}

// Export singleton instance
export const defaultLogger = new Logger();
