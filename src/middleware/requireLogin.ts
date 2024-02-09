import { Logger } from '@/lib/logger';
import { Request, Response, NextFunction } from 'express';

const logger = new Logger(__filename);
export const requireLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.locals.user) {
    return next();
  } else {
    logger.warn('User is not logged in');
    return next();
  }
};
