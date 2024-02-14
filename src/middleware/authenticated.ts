import { AuthFailureError } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger as l } from '@/lib/logger';
import { reIssueAccessToken, verifyToken } from '@/lib/utils/tokens';
import { User } from '@/modules/auth/users/user.model';
import { Request, Response, NextFunction, Router } from 'express';
import { loggers } from 'winston';
const logger = new l(__filename);

export const authenticate = asyncHandler(async (req, res, next) => {
  const accessToken = req.headers['x-access-token'];
  const refreshToken: string = req.headers['x-refresh-token'] as string;

  if (!accessToken) {
    logger.warn('No access token found');
    return res.status(403).json({ message: 'Access token required' });
  }

  const { decoded, valid, expired } = verifyToken(
    accessToken.toString(),
    'access',
  );

  if (decoded) {
    req.user = decoded;
    logger.info({
      message: 'User authenticated',
      user: decoded,
    });
    return next();
  }

  // If token is expired and a refresh token exists, attempt to issue a new access token.
  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (!newAccessToken) {
      logger.debug(
        'Failed to re-issue access token with the provided refresh token.',
      );
      return res.status(403).json({
        message: 'Failed to re-issue access token, invalid refresh token',
      });
    }

    res.setHeader('x-access-token', newAccessToken);
    const result = verifyToken(newAccessToken, 'access');
    if (result.decoded) {
      req.user = result.decoded.user; 
      logger.info({
        event: 'TokenReissued',
        user: result.decoded.user.name,
      });
      return next();
    }
  }

  if (!valid || expired) {
    logger.warn('Invalid or expired access token, unable to authenticate.');
    return res.status(403).json({ message: 'Invalid or expired access token' });
  }

  return next();
});

export const allowUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || !req.roles) {
    logger.warn('User not authenticated');
    return next();
  } else if ((req.user as User).roles == req.roles) {
    logger.info({
      user: 'Authenticated',
      requireRole: `${req.roles}`,
      userRole: `${(req.user as User).roles}`,
    });
    return next();
  }

  logger.error('User not allowed');
  next();
};

const router = Router();

router.use(allowUser);
export default router;
