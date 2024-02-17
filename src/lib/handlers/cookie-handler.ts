import { get } from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger';
const logger = new Logger(__filename);
export const cookieHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const access = req.cookies.access;
  const refresh = req.cookies.refresh;

  if (!access && !refresh) {
    logger.warn({
      event: 'No cookies found',
    });
    return next();
  }
  if (access) {
    req.headers['x-access-token'] = access;
  }
  if (refresh) {
    req.headers['x-refresh-token'] = refresh;
  }

  next();
};
