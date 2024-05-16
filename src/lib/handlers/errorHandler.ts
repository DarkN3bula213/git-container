import type { Application, NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ApiError, ErrorType, InternalError, NotFoundError } from '../api';
import { config } from '../config';
import { Logger } from '../logger';

const logger = new Logger(__filename);

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
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

export default (app: Application) => {
  app.all('*', (_req, _res, next) => next(new NotFoundError()));
  app.use(errorHandler);
};
