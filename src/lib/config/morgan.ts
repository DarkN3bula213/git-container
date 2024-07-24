import colors from 'colors';
import dayjs from 'dayjs';
import type { Request } from 'express';
import morgan from 'morgan';
import { config } from './config';

if (!config.isTest) {
  morgan.token('auth', (req: Request) => {
    return req.cookies.access ? 'Auth' : 'No Auth';
  });
}

// Custom token for colored HTTP methods
morgan.token('colored-method', (req) => {
  const method = req.method || 'GET';
  switch (method) {
    case 'GET':
      return colors.green(method);
    case 'POST':
      return colors.blue(method);
    case 'PUT':
      return colors.yellow(method);
    case 'DELETE':
      return colors.red(method);
    default:
      return colors.grey(method);
  }
});

morgan.format('myFormat', (tokens, req, res) => {
  const timestamp = colors.grey(dayjs().format('| [+] | MM-DD HH:mm:ss'));
  const method = tokens['colored-method'](req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens['response-time'](req, res);
  const authStatus = tokens.auth(req, res);

  return `${timestamp} [${method}]: ${url} - ${authStatus} - Status: ${status} - ${responseTime} ms`;
});

export const morganMiddleware = morgan('myFormat');
