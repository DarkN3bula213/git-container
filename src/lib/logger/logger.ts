/* eslint-disable @typescript-eslint/no-explicit-any */
import colors from 'colors';
import dayjs from 'dayjs';
import fs from 'node:fs';
import * as path from 'node:path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/config';

export const getRotateFileOptions = ({
	dir,
	level
}: {
	dir: string;
	level: string;
}): DailyRotateFile.DailyRotateFileTransportOptions => {
	return {
		level: level,
		filename: `${dir}/%DATE%.log`,
		datePattern: 'YYYY-MM-DD',
		zippedArchive: true,
		handleExceptions: true,
		maxSize: '20m',
		maxFiles: '14d',
		format: format.combine(
			formattedTimestamp,
			format.errors({ stack: false }),
			format.splat(),
			format.uncolorize(), // Strip colors for file output
			format.printf((info) => {
				return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`;
			})
		)
	};
};

// Define custom colors for log levels
colors.setTheme({
	info: 'black',
	warn: 'yellow',
	error: 'red',
	debug: 'blue',
	// Define custom styles for timestamp and message backgrounds
	timestampBg: 'bgCyan', // This is an approximation; adjust as needed
	infoMessage: 'white',
	warnMessage: 'cyan',
	errorMessage: 'magenta',
	debugMessage: 'blue'
});

// eslint-disable-next-line no-unused-vars
const formattedTimestamp = format((info, _opts) => {
	info.timestamp = dayjs().format('| [+] | MM-DD HH:mm:ss');

	return info;
})();
const formatLevel = (level: string) => {
	switch (level) {
		case 'error':
			return colors.red(level.toUpperCase());
		case 'warn':
			return colors.cyan(level.toUpperCase());
		case 'info':
			return colors.yellow(level.toUpperCase());
		case 'debug':
			return colors.blue(level.toUpperCase());
		default:
			return level.toUpperCase();
	}
};

let dir: string;
try {
	// First try to get directory from config
	dir = config?.log?.directory || '';
} catch (error) {
	// If config access fails, fallback to default
	dir = '';
}

// If no valid directory, fallback to default
if (!dir) {
	dir = path.resolve(process.cwd(), 'logs');
}

// Ensure the directory exists
try {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
} catch (error) {
	// If we can't create the directory, fallback to current working directory
	console.error(`Failed to create logs directory: ${error}`);
	dir = process.cwd();
	if (!fs.existsSync(path.join(dir, 'logs'))) {
		fs.mkdirSync(path.join(dir, 'logs'));
	}
}

// Also update the logLevel determination to be more defensive
const logLevel = (() => {
	try {
		return config?.isProduction || config?.isDocker ? 'error' : 'debug';
	} catch (error) {
		return 'debug'; // Default to debug if config access fails
	}
})();

const dailyRotateFile = new DailyRotateFile(
	getRotateFileOptions({
		dir,
		level: logLevel
	})
);
const exceptionHandler = format.combine(
	formattedTimestamp,
	format.errors({ stack: true }),
	format.printf((info) => {
		const stack = info.stack ? `\n${info.stack}` : '';
		return `${colors.grey(info.timestamp)} [${colors.red('UNCAUGHT')}]: ${info.message}${stack}`;
	})
);
export class Logger {
	public static readonly DEFAULT_SCOPE = 'app';

	private static readonly logger = createLogger({
		level: logLevel,
		defaultMeta: {
			scope: Logger.DEFAULT_SCOPE
		},
		transports: [
			new transports.Console({
				level: logLevel,
				handleExceptions: true,
				handleRejections: true,
				format: format.combine(
					formattedTimestamp,
					format.errors({ stack: true }),
					format.splat(),
					format.printf((info) => {
						const messageColor = (colors as any)[
							`${info.level}Message`
						];
						const message = messageColor
							? messageColor(info.message)
							: info.message;
						const stack = info.stack ? `\n${info.stack}` : '';
						return `${colors.grey(info.timestamp)} [${formatLevel(info.level)}]: ${message}${stack}`;
					})
				)
			}),
			dailyRotateFile
		],
		exitOnError: false,
		exceptionHandlers: [
			new transports.Console({
				format: format.combine(
					formattedTimestamp,
					format.errors({ stack: true }),
					format.printf((info) => {
						const stack = info.stack ? `\n${info.stack}` : '';
						return `${colors.grey(info.timestamp)} [${colors.red('UNCAUGHT EXCEPTION')}]: ${info.message}${stack}`;
					})
				)
			}),
			new transports.File({
				filename: path.join(
					dir,
					`exceptions-${dayjs().format('YYYY-MM-DD')}.log`
				),
				format: format.combine(
					formattedTimestamp,
					format.errors({ stack: true }),
					format.uncolorize(),
					format.json(),
					format.printf((info) => {
						const stack = info.stack ? `\n${info.stack}` : '';
						return `${info.timestamp} [UNCAUGHT EXCEPTION]: ${info.message}${stack}`;
					})
				)
			})
		],
		rejectionHandlers: [
			new transports.Console({
				format: exceptionHandler
			}),
			new transports.File({
				filename: `rejections-${dayjs().format('YYYY-MM-DD')}.log`,
				dirname: dir,
				format: format.combine(
					formattedTimestamp,
					format.errors({ stack: true }),
					format.uncolorize(),
					format.printf((info) => {
						return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`;
					})
				)
			})
		]
	});
	private static parsePathToScope(filepath: string): string {
		let parsedPath = filepath;
		if (parsedPath.indexOf(path.sep) >= 0) {
			parsedPath = parsedPath.replace(process.cwd(), '');
			parsedPath = parsedPath.replace(`${path.sep}src${path.sep}`, '');
			parsedPath = parsedPath.replace(`${path.sep}dist${path.sep}`, '');
			parsedPath = parsedPath.replace('.ts', '');
			parsedPath = parsedPath.replace('.js', '');
			parsedPath = parsedPath.replace(path.sep, ':');
		}
		return parsedPath;
	}
	private readonly scope: string;

	constructor(scope?: string) {
		this.scope = Logger.parsePathToScope(scope ?? Logger.DEFAULT_SCOPE);
	}
	public debug(message: string | object, ...args: any[]): void {
		this.log('debug', message, args);
	}

	public info(message: string | object, ...args: any[]): void {
		this.log('info', message, args);
	}

	public warn(message: string | object, ...args: any[]): void {
		this.log('warn', message, args);
	}

	public error(message: string | object | Error, ...args: any[]): void {
		if (message instanceof Error) {
			this.log('error', message.message, [
				...args,
				{ stack: message.stack }
			]);
		} else {
			this.log('error', message, args);
		}
	}

	// eslint-disable-next-line no-unused-vars
	private log(level: string, message: string | object, _args: any[]): void {
		const MAX_DEPTH = 3; // Prevent deep nesting
		const MAX_ARRAY_LENGTH = 100; // Limit array output
		const MAX_STRING_LENGTH = 1000; // Limit string length

		const timestamp = colors.grey(dayjs().format('| [+] | MM-DD HH:mm:ss'));
		const prefix = `${timestamp} ${colors.cyan(':----:')}`;

		if (typeof message === 'object' && message !== null) {
			let formattedMessage = `${this.scope}\n`;
			const seen = new WeakSet(); // Track circular references

			const formatValue = (
				value: unknown,
				indent = '',
				depth = 0
			): string => {
				// Handle depth limit
				if (depth >= MAX_DEPTH)
					return colors.yellow('[Max Depth Reached]');

				// Handle null/undefined
				if (value === null) return colors.red('null');
				if (value === undefined) return colors.red('undefined');

				// Handle circular references
				if (typeof value === 'object' && value !== null) {
					if (seen.has(value))
						return colors.yellow('[Circular Reference]');
					seen.add(value);
				}

				try {
					// Handle different types
					if (Array.isArray(value)) {
						const items = value
							.slice(0, MAX_ARRAY_LENGTH)
							.map((v) =>
								formatValue(v, indent + '  ', depth + 1)
							);
						const hasMore = value.length > MAX_ARRAY_LENGTH;
						const moreItemsText = hasMore
							? ',\n  ... more items'
							: '';
						return (
							'[\n' +
							indent +
							'  ' +
							items.join(',\n' + indent + '  ') +
							moreItemsText +
							'\n' +
							indent +
							']'
						);
					}

					if (typeof value === 'object') {
						const entries = Object.entries(value);
						const lines = entries.map(([k, v]) => {
							const coloredKey = colors.yellow(`"${k}"`);
							const formattedVal = formatValue(
								v,
								`${indent}  `,
								depth + 1
							);
							return `${indent}  ${coloredKey}: ${formattedVal}`;
						});
						return `{\n${lines.join(',\n')}\n${indent}}`;
					}

					if (typeof value === 'string') {
						const truncated =
							value.length > MAX_STRING_LENGTH
								? value.slice(0, MAX_STRING_LENGTH) +
									'...[truncated]'
								: value;
						return colors.green(`"${truncated}"`);
					}

					if (typeof value === 'number')
						return colors.cyan(String(value));
					if (typeof value === 'boolean')
						return colors.blue(String(value));

					return String(value);
				} catch (error) {
					return colors.red('[Error formatting value]');
				}
			};

			try {
				const lines = Object.entries(message).map(([key, value]) => {
					const coloredKey = colors.cyan(key);
					const formattedValue = formatValue(value)
						.split('\n')
						.map((line, i) =>
							i === 0 ? line : `${prefix} ${line}`
						)
						.join('\n');
					return `${prefix} ${coloredKey}: ${formattedValue}`;
				});

				formattedMessage += lines.join('\n');
				Logger.logger.log(level, formattedMessage);
			} catch (error) {
				Logger.logger.error(`Error formatting log message: ${error}`);
			}
		} else {
			Logger.logger.log({
				level,
				message:
					typeof message === 'string'
						? message.slice(0, MAX_STRING_LENGTH)
						: String(message),
				timestamp: dayjs().format('| [+] | MM-DD HH:mm:ss')
			});
		}
	}
}
