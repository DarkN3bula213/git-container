import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger';

const logger = new Logger('Global');

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.NODE_ENV === 'development') {
    logger.error(
      `500 - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    );
  } else {
    logger.error(err.message);
  }
  if (!res.headersSent) {
    res.status(500).send('Internal Server Error');
  }
};
