/* eslint-disable @typescript-eslint/no-explicit-any */
import colors from 'colors';
import dayjs from 'dayjs';
import fs from 'node:fs';
import * as path from 'node:path';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config';

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

const levelColors: levelColorMap = {
	info: 'yellow',
	warn: 'cyan',
	error: 'red',
	debug: 'blue'
};

type levelColorMap = {
	[key: string]: string;
};

// const timestamp = colors.grey(dayjs().format('| [+] | MM-DD HH:mm:ss'));

// eslint-disable-next-line no-unused-vars
const customTimestampFormat = winston.format((info, _opts) => {
	info.timestamp = dayjs().format('| [+] | MM-DD HH:mm:ss');

	return info;
})();
const errorStackFormat = winston.format((info) => {
	if (info instanceof Error || info.error instanceof Error) {
		const error = info instanceof Error ? info : info.error;
		return {
			...info,
			message: `${info.message}\n${error.stack}`,
			stack: error.stack,
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack
			}
		};
	}
	return info;
});

const customPrintf = winston.format.printf((info) => {
	const timestamp = colors.grey(info.timestamp);
	const levelColor = levelColors[info.level] || 'white';
	const messageColor = (colors as any)[`${info.level}Message`];
	const level = (colors as any)[levelColor](info.level.toUpperCase());
	const message = messageColor ? messageColor(info.message) : info.message;

	return `${timestamp} [${level}]: ${message}`;
});
const consoleFormat = winston.format.combine(
	winston.format.errors({ stack: true }),
	customTimestampFormat,
	errorStackFormat(),
	customPrintf
);
const fileFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.errors({ stack: true }),
	errorStackFormat(),
	winston.format.json()
);
/**
 *
 *
 *
 *
 *
 */
let dir = config.log.directory;
if (!dir) dir = path.resolve('logs');
if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir);
}

const logLevel = config.isProduction || config.isDocker ? 'error' : 'debug';
const dailyRotateFile = new DailyRotateFile({
	level: logLevel,
	filename: `${dir}/%DATE%.log`,
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	handleExceptions: true,
	maxSize: '20m',
	maxFiles: '14d',
	format: config.isProduction
		? winston.format.combine(
				winston.format.timestamp(),
				winston.format.errors({ stack: true }),
				winston.format.json()
			)
		: winston.format.combine(
				customTimestampFormat,
				winston.format.errors({ stack: false }),
				customPrintf
			)
});

export class Logger {
	public static readonly DEFAULT_SCOPE = 'app';

	private static readonly logger = winston.createLogger({
		level: 'debug',
		format: winston.format.combine(
			winston.format.errors({ stack: false }),
			errorStackFormat(),
			customTimestampFormat,
			customPrintf
		),
		transports: [
			new winston.transports.Console({
				format: consoleFormat,
				level: 'debug'
			}),
			dailyRotateFile
		],
		exceptionHandlers: [
			new winston.transports.Console({
				format: consoleFormat,
				level: 'error'
			}),
			new winston.transports.File({
				filename: `${dir}/exceptions.log`,
				format: fileFormat
			})
		],
		rejectionHandlers: [
			new winston.transports.Console({
				format: consoleFormat,
				level: 'error'
			}),
			new winston.transports.File({
				filename: `${dir}/rejections.log`,
				format: fileFormat
			})
		],
		exitOnError: false
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

	public error(message: string | Error | object, ...args: any[]): void {
		this.log('error', message, args);
	}
	// eslint-disable-next-line no-unused-vars
	// private log(level: string, message: string | object, _args: any[]): void {
	// 	const timestamp = colors.grey(dayjs().format('| [+] | MM-DD HH:mm:ss'));
	// 	const prefix = `${timestamp} ${colors.cyan(':----:')}`;

	// 	if (typeof message === 'object') {
	// 		let formattedMessage = `${this.scope}\n`;

	// 		const formatValue = (value: unknown, indent = ''): string => {
	// 			if (value === null) return colors.red('null');
	// 			if (value === undefined) return colors.red('undefined');
	// 			if (typeof value === 'object') {
	// 				const entries = Object.entries(value);
	// 				const lines = entries.map(([k, v]) => {
	// 					const coloredKey = colors.yellow(`"${k}"`);
	// 					const formattedVal = formatValue(v, `${indent}  `);
	// 					return `${indent}  ${coloredKey}: ${formattedVal}`;
	// 				});
	// 				return `{\n${lines.join(',\n')}\n${indent}}`;
	// 			}
	// 			if (typeof value === 'string')
	// 				return colors.green(`"${value}"`);
	// 			if (typeof value === 'number')
	// 				return colors.cyan(String(value));
	// 			if (typeof value === 'boolean')
	// 				return colors.blue(String(value));
	// 			return String(value);
	// 		};

	// 		const lines = Object.entries(message).map(([key, value]) => {
	// 			const coloredKey = colors.cyan(key);
	// 			const formattedValue = formatValue(value)
	// 				.split('\n')
	// 				.map((line, i) => (i === 0 ? line : `${prefix} ${line}`))
	// 				.join('\n');
	// 			return `${prefix} ${coloredKey}: ${formattedValue}`;
	// 		});

	// 		formattedMessage += lines.join('\n');
	// 		Logger.logger.log(level, formattedMessage);
	// 	} else {
	// 		Logger.logger.log({
	// 			level,
	// 			message: message,
	// 			timestamp: dayjs().format('| [+] | MM-DD HH:mm:ss')
	// 		});
	// 	}
	// }
	// eslint-disable-next-line no-unused-vars
	private log(level: string, message: string | object, _args: any[]): void {
		const MAX_DEPTH = 3; // Prevent deep nesting
		const MAX_ARRAY_LENGTH = 10; // Limit array output
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
