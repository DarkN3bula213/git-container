import colors from 'colors';
import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/config';

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
	const timestamp = new Date().toLocaleString('en-US', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	});
	return colors.gray(`| + | ${timestamp}`);
};

// Console formatter for development
const consoleFormat = winston.format.combine(
	winston.format.errors({ stack: true }),
	winston.format.timestamp(),
	winston.format.printf((info) => {
		const color = getColor(info.level);
		const level = color(info.level.padEnd(5).toUpperCase());
		const timestamp = getFormattedTimestamp();
		const scope = info.scope
			? colors.cyan(
					` [${path.basename(path.dirname(info.scope))}/${path.basename(info.scope)}]`
				)
			: '';

		// Handle object logging (e.g., { event: "some event", message: "some log" })
		let message = info.message;
		if (typeof message === 'object' && message !== null) {
			try {
				message = Object.entries(message)
					.map(
						([key, value]) =>
							`${colors.yellow(key)}: ${colors.green(JSON.stringify(value))}`
					)
					.join(', ');
			} catch {
				message = colors.red('[Error formatting log message]');
			}
		}

		const stack = info.stack ? `\n${colors.gray(info.stack)}` : '';
		return `${timestamp} [${level}] ${scope}: ${message}${stack}`;
	})
);

// File formatter for production
const fileFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.errors({ stack: true }),
	winston.format.json()
);

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
	})
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
		}),
		new winston.transports.Console({ format: consoleFormat })
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
		}),
		new winston.transports.Console({ format: consoleFormat })
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
			this.log('error', message.message, [
				...meta,
				{ stack: message.stack }
			]);
		} else {
			this.log('error', message, meta);
		}
	}

	private log(
		level: string,
		message: string | Record<string, unknown>,
		meta: any[]
	) {
		if (typeof message === 'object') {
			this.logger.log(level, { ...message, meta });
		} else {
			this.logger.log(level, message, ...meta);
		}
	}
}

// Export singleton instance
export const defaultLogger = new Logger();
