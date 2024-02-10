import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import { signToken, verifyToken } from '@/lib/utils/tokens';
import { reIssueAccessToken } from '@/modules/auth/session/session.utils';
import { Request, Response, NextFunction } from 'express';



const logger = new Logger(__filename);


/**
 * A middleware function to require login for protected routes.
 *
 * [+] The auth head may be removed in refactoring
 */
export const requireLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Extract the token from the request's authorization header
  // const authHeader = req.headers['authorization'];
  // const token = authHeader && authHeader.split(' ')[1];

  const accessToken = req.headers['x-access-token'];
  const refreshToken: string = req.headers['x-refresh-token'] as string;

  if (!accessToken) {
    logger.warn('No access token found');
    return next();
  }
  const { decoded, valid, expired } = verifyToken(
    accessToken.toString(),
    'access',
  );

  // if (!valid) {
  //   logger.warn('Access token invalid');
  //   return next();
  // }
  if (decoded) {
    req.user = decoded;
    logger.info(`User: ${JSON.stringify(decoded)}`);
    return next();
  }
  if (!valid && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (newAccessToken) {
      res.setHeader('x-access-token', newAccessToken);
    }

    const result = verifyToken(newAccessToken as string, 'access');
    const user = result.decoded?.user;
    req.user = user;
    logger.info(`User: ${JSON.stringify(result.decoded)}`);
    return next();
  } 
};
