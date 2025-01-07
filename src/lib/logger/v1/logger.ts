// import { config } from '@/lib/config';
// import { inspect } from 'util';
// import winston, { format } from 'winston';
// import 'winston-daily-rotate-file';
// import LokiTransport from 'winston-loki';
// import { defaultScope } from '../loggerConfig';

// const jsColorMapping = {
// 	debug: '\u001b[32m',
// 	// Make info gray
// 	info: '\u001b[37m',
// 	warn: '\u001b[33m',
// 	error: '\u001b[31m'
// } as const;

// type LogLevel = keyof typeof jsColorMapping;

// export class Logger {
// 	private readonly logger: winston.Logger;
// 	private readonly isDev: boolean;

// 	constructor(service: string) {
// 		this.isDev = !config.isProduction;

// 		// Custom format for development environment
// 		const devFormat = winston.format.combine(
// 			winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
// 			winston.format.colorize(),
// 			winston.format.printf(
// 				({ level, message, timestamp, ...metadata }) => {
// 					const metaString = Object.keys(metadata).length
// 						? `\n${inspect(metadata, { colors: true, depth: 5 })}`
// 						: '';

// 					return `${timestamp} [${level}] ${
// 						typeof message === 'object'
// 							? Object.entries(message).map(
// 									([key, value]) =>
// 										`${jsColorMapping[level as LogLevel]}${key}: ${value}\u001b[0m`
// 								)
// 							: // Trim the last newline and remove the "" and +

// 								message
// 					}${metaString}`;
// 				}
// 			)
// 		);

// 		// Production format with proper serialization
// 		const prodFormat = winston.format.combine(
// 			winston.format.timestamp(),
// 			winston.format.errors({ stack: true }),
// 			winston.format.metadata(),
// 			winston.format.json()
// 		);

// 		const transports: winston.transport[] = [
// 			// Console Transport
// 			new winston.transports.Console({
// 				format: !config.isProduction ? devFormat : prodFormat
// 			})
// 		];

// 		// Add Daily Rotate File Transport in production
// 		if (config.isProduction) {
// 			transports.push(
// 				new winston.transports.DailyRotateFile({
// 					filename: 'logs/app-%DATE%.log',
// 					datePattern: 'YYYY-MM-DD',
// 					zippedArchive: true,
// 					maxSize: '20m',
// 					maxFiles: '14d',
// 					format: format.logstash()
// 				})
// 			);

// 			// Add Loki Transport in production
// 			transports.push(
// 				new LokiTransport({
// 					host: config.production
// 						? 'http://loki:3100'
// 						: 'http://localhost:3100',
// 					labels: {
// 						service,
// 						environment: config.production ? 'prod' : 'dev'
// 					},
// 					json: true,
// 					format: winston.format.combine(
// 						winston.format.metadata(),
// 						winston.format.json()
// 					),
// 					replaceTimestamp: false,
// 					onConnectionError: (err) =>
// 						console.error('Loki connection error:', err)
// 				})
// 			);
// 		}

// 		this.logger = winston.createLogger({
// 			level: this.isDev ? 'debug' : 'info',
// 			defaultMeta: {
// 				scope: defaultScope,
// 				environment: config.production ? 'prod' : 'dev'
// 			},
// 			transports,
// 			format: format.combine(format.timestamp(), format.prettyPrint()),
// 			exceptionHandlers: [
// 				new winston.transports.File({ filename: 'logs/exceptions.log' })
// 			],
// 			rejectionHandlers: [
// 				new winston.transports.File({ filename: 'logs/rejections.log' })
// 			],
// 			exitOnError: false
// 		});
// 	}

// 	info(message: string | object, meta: object = {}): void {
// 		this.logger.info(
// 			typeof message === 'string' ? message : JSON.stringify(message),
// 			meta
// 		);
// 	}

// 	error(message: string | object, error?: unknown, meta: object = {}): void {
// 		const errorMeta = {
// 			...meta,
// 			error:
// 				error instanceof Error
// 					? {
// 							message: error.message,
// 							stack: error.stack,
// 							name: error.name,
// 							...Object.getOwnPropertyNames(error).reduce(
// 								(acc, key) => {
// 									if (
// 										!['message', 'stack', 'name'].includes(
// 											key
// 										)
// 									) {
// 										acc[key] = (error as any)[key];
// 									}
// 									return acc;
// 								},
// 								{} as Record<string, unknown>
// 							) // Captures custom error properties without overwriting
// 						}
// 					: error
// 		};

// 		this.logger.error(
// 			typeof message === 'string' ? message : JSON.stringify(message),
// 			errorMeta
// 		);
// 	}

// 	debug(message: string | object, meta: object = {}): void {
// 		this.logger.debug(
// 			typeof message === 'string' ? message : JSON.stringify(message),
// 			meta
// 		);
// 	}

// 	warn(message: string | object, meta: object = {}): void {
// 		this.logger.warn(
// 			typeof message === 'string' ? message : JSON.stringify(message),
// 			meta
// 		);
// 	}
// }
