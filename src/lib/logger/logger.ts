 
import dayjs from 'dayjs';
import * as path from 'path';
import * as winston from 'winston';
import colors from 'colors';
import { config } from '../config';
import fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';
// Define custom colors for log levels
colors.setTheme({
  info: 'black',
  warn: 'yellow',
  error: 'red',
  debug: 'blue',
  // Define custom styles for timestamp and message backgrounds
  timestampBg: 'bgCyan', // This is an approximation; adjust as needed
  infoMessage: 'green',
  warnMessage: 'teal',
  errorMessage: 'magenta',
  debugMessage: 'magenta',
});

const levelColors: levelColorMap = {
  info: 'yellow',
  warn: 'yellow',
  error: 'red',
  debug: 'blue',
};

type levelColorMap = {
  [key: string]: string;
};

const timestamp = colors.grey(dayjs().format('| [+] | MM-DD HH:mm:ss'));

const customTimestampFormat = winston.format((info, opts) => {
  info.timestamp = dayjs().format('| [+] | MM-DD HH:mm:ss');

  return info;
})();

const customPrintf = winston.format.printf((info) => {
  const timestamp = colors.grey(info.timestamp);
  const levelColor = levelColors[info.level] || 'white';
  const messageColor = (colors as any)[`${info.level}Message`];
  const level = (colors as any)[levelColor](info.level.toUpperCase());
  const message = messageColor ? messageColor(info.message) : info.message;

  return `${timestamp} [${level}]: ${message}`;
});

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
  filename: dir + '/%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  handleExceptions: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.errors({ stack: false }),
    winston.format.splat(),
    winston.format.timestamp(),
    winston.format.prettyPrint(),
  ),
});

/**
 *
 *
 *
 *
 *
 *
 */

export class Logger {
  public static DEFAULT_SCOPE = 'app';

  private static logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      customTimestampFormat,
      winston.format.errors({ stack: true }),
      customPrintf,
    ),

    transports: [new winston.transports.Console(), dailyRotateFile],
    exceptionHandlers: [dailyRotateFile],
    exitOnError: false,
  });
  private static parsePathToScope(filepath: string): string {
    if (filepath.indexOf(path.sep) >= 0) {
      filepath = filepath.replace(process.cwd(), '');
      filepath = filepath.replace(`${path.sep}src${path.sep}`, '');
      filepath = filepath.replace(`${path.sep}dist${path.sep}`, '');
      filepath = filepath.replace('.ts', '');
      filepath = filepath.replace('.js', '');
      filepath = filepath.replace(path.sep, ':');
    }
    return filepath;
  }

  private scope: string;

  constructor(scope?: string) {
    this.scope = Logger.parsePathToScope(scope ? scope : Logger.DEFAULT_SCOPE);
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
  private log(level: string, message: string | object, args: any[]): void {
    if (typeof message === 'object') {
      // Start with the scope line
      let formattedMessage = `${this.scope} \n`;
      if (!config.isProduction) {
        const lines = Object.entries(message).map(([key, value]) => {
          // Apply a color to the key. For example, using blue for keys
          const coloredKey = colors.cyan(key);
          return `${timestamp} ${colors.cyan(`:-----:`)} ${coloredKey}: ${value}`;
        });
        formattedMessage += lines.join('\n');
      } else {
        // Production logging: simpler and without colors
        // Optionally, consider using JSON.stringify for structured logging
        const messageString = JSON.stringify(message);
        formattedMessage += `| + | ${messageString}`;
      }

      Logger.logger.log(level, formattedMessage);
    } else {
      // Handle regular logging
      const formattedMessage = `${timestamp} ${message}`;
      Logger.logger.log({
        level,
        message: formattedMessage,
      });
    }
  }
}
