import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import { verifyToken } from '@/lib/utils/tokens';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
const logger = new Logger(__filename);
export const requireLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Extract the token from the request's authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  const accessToken = req.headers['x-access-token'];
  const refreshToken = req.headers['x-refresh-token'];

  if (!accessToken && !refreshToken) {
    logger.info('No token provided');
    // return res.sendStatus(401);
    return next();
  }
  if (accessToken) {
    try {
      const token = accessToken.toString();
      const { decoded } = verifyToken(token, 'access');
      logger.debug(`User ${JSON.stringify(decoded)} logged in successfully`);

      return next();
    } catch (e: any) {
      logger.error(e);

      if (e.message === 'Token expired' && refreshToken) {
        try {
          const token = refreshToken?.toString();
          const { decoded } = verifyToken(token, 'refresh');
          logger.debug(
            `User ${JSON.stringify(decoded)} logged n successfully`,
          );
        } catch (e: any) {
          logger.error(e);
        }
      }

      return next();
    }
  } else {
    // jwt.verify(token, config.tokens.jwtSecret, (err: any, user: any) => {
    //   if (err) return res.sendStatus(403);
    //   logger.debug(`User ${user.email} logged in successfully`);
    //   req.user = user;
    //   next();
    // });
    next();
  }
};
