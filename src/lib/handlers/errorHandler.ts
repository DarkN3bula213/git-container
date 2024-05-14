import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger';
import { ApiError, ErrorType, InternalError } from '../api';
import { config } from '../config';
import { MulterError } from 'multer';

const logger = new Logger(__filename);

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    ApiError.handle(err, res);
    if (err.type === ErrorType.INTERNAL) {
      logger.error({
        'status: ': 500,
        'message: ': err.message,
        'method: ': req.method,
      });
    }
  } else if (err instanceof MulterError) {
    const multerError: MulterError = err;
    const statusCode = multerError.code === 'LIMIT_UNEXPECTED_FILE' ? 400 : 500;

    logger.error({
      'status: ': statusCode,
      'message: ': err.message,
      'method: ': req.method,
    });

    res.status(statusCode).json({ error: err.message });
  } else {
    logger.error(err.message);
    if (config.isDevelopment) {
      return res.status(500).send(err);
    }
    ApiError.handle(new InternalError(), res);
  }
};
