/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import dayjs from 'dayjs';
import * as path from 'path';
import * as winston from 'winston';
import colors from 'colors';
import { config } from '../config';

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

const timestamp = colors.grey(dayjs().format('| [+] | MM-DD HH:mm'));
const customTimestampFormat = winston.format((info, opts) => {
  info.timestamp = dayjs().format('| [+] | MM-DD HH:mm');
  return info;
})();
const customPrintf = winston.format.printf((info) => {
  const timestamp = colors.grey(info.timestamp);
  const levelColor = levelColors[info.level] || 'white';

  const level = (colors as any)[levelColor](info.level.toUpperCase());

  const messageColor = (colors as any)[`${info.level}Message`];
  const message = messageColor ? messageColor(info.message) : info.message;
  return `${timestamp} [${level}]: ${message}`;
});
export class Logger {
  public static DEFAULT_SCOPE = 'app';

  private static logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      customTimestampFormat,
      winston.format.errors({ stack: true }),
      customPrintf,
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: `${config.log.directory}/error.log`,
        level: 'error',
        format: winston.format.combine(
          customTimestampFormat,
          winston.format.errors({ stack: true }),
          winston.format.prettyPrint(),
        ),
      }),
    ],
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
      const formattedMessage = `[${this.scope}] ${message}`;
      Logger.logger.log({
        level,
        message: formattedMessage,
        extra: args.length ? args : undefined,
      });
    }
  }
}
