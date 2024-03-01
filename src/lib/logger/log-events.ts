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
 
  try {
    if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
      await promises.mkdir(path.join(__dirname, '..', 'logs'));
    }
    await promises.appendFile(
      path.join(__dirname, '..', 'logs', logFileName),
      logItem,
    );
  } catch (err) {
    logger.error({ err });
  }
}
const logger = new Logger(__filename);

import { Request, Response, NextFunction } from 'express';

export function RequestLogger(req: Request, res: Response, next: NextFunction) {
  logEvents({
    message: `${req.method}\t${req.url}\t${req.headers.origin}`,
    logFileName: 'request.log',
  });
  next();
}
