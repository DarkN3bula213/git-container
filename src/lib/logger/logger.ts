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
  warnMessage: 'bgYellow',
  errorMessage: 'magenta',
  debugMessage: 'bgBlue',
});

const levelColors: levelColorMap = {
  info: 'green',
  warn: 'yellow',
  error: 'red',
  debug: 'blue',
};

type levelColorMap = {
  [key: string]: string;
};
const customTimestampFormat = winston.format((info, opts) => {
  info.timestamp = dayjs().format('| [+] | MM-DD HH:mm');
  return info;
})();
const customPrintf = winston.format.printf((info) => {
  const timestamp = colors.grey(info.timestamp);

  // const level = (colors as any)[info.level](
  //   colors.white(info.level.toUpperCase()),
  // );
  // Safely access the color using the log level, with a fallback to 'white'
  const levelColor = levelColors[info.level] || 'white';

  const level = (colors as any)[levelColor]( info.level.toUpperCase() );

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

  public debug(message: string, ...args: any[]): void {
    this.log('debug', message, args);
  }

  public info(message: string, ...args: any[]): void {
    this.log('info', message, args);
  }

  public warn(message: string, ...args: any[]): void {
    this.log('warn', message, args);
  }

  public error(message: string, ...args: any[]): void {
    this.log('error', message, args);
  }

  private log(level: string, message: string, args: any[]): void {
    Logger.logger.log({
      level,
      message: `[${this.scope}] ${message}`,
      extra: args,
    });
  }

  private formatScope(): string {
    return `[${this.scope}]`;
  }
}
