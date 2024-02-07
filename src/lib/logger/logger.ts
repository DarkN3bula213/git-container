import dayjs from 'dayjs';
import * as path from 'path';
import * as winston from 'winston';
import colors from 'colors';
import * as fs from 'fs';

// Define custom colors for log levels
colors.setTheme({
  info: 'green',
  warn: 'yellow',
  error: 'red',
  debug: 'blue',
  // Define custom styles for timestamp and message backgrounds
  timestampBg: 'bgCyan', // This is an approximation; adjust as needed
  infoMessage: 'bgGreen',
  warnMessage: 'bgYellow',
  errorMessage: 'bgRed',
  debugMessage: 'bgBlue',
});

const customTimestampFormat = winston.format((info, opts) => {
  info.timestamp = dayjs().format('DD-MM HH:mm:ss'); // Customize the format as needed
  return info;
})();
const customPrintf = winston.format.printf((info) => {
  const timestamp = colors.bgCyan(info.timestamp); // Apply background color to timestamp
  const level = (colors as any)[info.level](info.level.toUpperCase()); // Keep level color unchanged
  const messageColor = (colors as any)[`${info.level}Message`]; // Select message color based on log level
  const message = messageColor ? messageColor(info.message) : info.message; // Apply message color or fallback
  return `${timestamp} ${level}: ${message}`;
});
export class Logger {
  public static DEFAULT_SCOPE = 'app';

  private static logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      customTimestampFormat,
      winston.format.printf((info) => {
        const colorize =
          (colors as any)[info.level] || ((text: string) => text); // Fallback function if no color defined
        return `${info.timestamp} ${colorize(`[${info.level}]:`)} ${colorize(info.message)}`;
      }),
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: `${process.env.LOG_DIR || '.'}/error.log`, // Use LOG_DIR environment variable or default to project root
        level: 'error',
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
