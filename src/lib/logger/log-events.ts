import fs, { promises } from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { randomUUID } from 'crypto';
import { Logger } from './logger';

type LogEventProps = {
  message: string;
  logFileName: string;
};

async function logEvents({ message, logFileName }: LogEventProps) {
  const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss');
  const logItem = `${dateTime}\t${randomUUID({
    disableEntropyCache: true,
  })}\t${message}\n`;

  let dir = config.log.directory;
  if (!dir) dir = path.resolve('logs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  await promises.appendFile(path.join(dir, logFileName), logItem);
}
const logger = new Logger(__filename);

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export async function RequestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  logEvents({
    message: `${req.method}\t${req.url}\t${req.headers.origin}`,
    logFileName: 'request.log',
  });
  next();
}
