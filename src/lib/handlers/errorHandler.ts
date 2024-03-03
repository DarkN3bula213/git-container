import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger';
import { ApiError, ErrorType, InternalError } from '../api';
import { config } from '../config';

const logger = new Logger(__filename);

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    ApiError.handle(err, res);
    if (err.type === ErrorType.INTERNAL)
      logger.error({
        'status: ': 500,
        'message: ': err.message,
        'method: ': req.method,
        'url: ': req.originalUrl,
        'headers: ': req.headers.origin,
      });
  } else {
    logger.error(err.message);
    if (config.isDevelopment) {
      return res.status(500).send(err);
    }
    ApiError.handle(new InternalError(), res);
  }
};
