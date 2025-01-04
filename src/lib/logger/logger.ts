import colors from 'colors';
import dayjs from 'dayjs';
import * as path from 'node:path';
import winston from 'winston';
import { defaultScope, logLevel } from './loggerConfig';
import { customPrintf, customTimestampFormat } from './loggerFormats';
import {
	consoleTransport,
	dailyRotateFileTransport,
	lokiTransport
} from './loggerTransports';

export class Logger {
	public static readonly DEFAULT_SCOPE = defaultScope;

	private static readonly logger = winston.createLogger({
		level: logLevel,
		defaultMeta: {
			scope: defaultScope
		},
		format: winston.format.combine(
			customTimestampFormat,
			winston.format.errors({ stack: true }),
			customPrintf
		),
		transports: [consoleTransport, dailyRotateFileTransport, lokiTransport],

		exceptionHandlers: [
			new winston.transports.File({ filename: 'logs/exceptions.log' })
		],
		rejectionHandlers: [
			new winston.transports.File({ filename: 'logs/rejections.log' })
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

	public error(message: string | object, ...args: any[]): void {
		this.log('error', message, args);
	}

	// eslint-disable-next-line no-unused-vars
	private log(level: string, message: string | object, _args: any[]): void {
		const timestamp = colors.grey(dayjs().format('| [+] | MM-DD HH:mm:ss'));

		if (typeof message === 'object') {
			let formattedMessage = `${this.scope} \n`;
			const lines = Object.entries(message).map(([key, value]) => {
				const coloredKey = colors.cyan(key);
				return `${timestamp} ${colors.cyan(':-----:')} ${coloredKey}: ${value}`;
			});
			formattedMessage += lines.join('\n');
			Logger.logger.log(level, formattedMessage);
		} else {
			const formattedMessage = `${message}`;
			Logger.logger.log({
				level,
				message: formattedMessage,
				timestamp: dayjs().format('| [+] | MM-DD HH:mm:ss')
			});
		}
	}
}
