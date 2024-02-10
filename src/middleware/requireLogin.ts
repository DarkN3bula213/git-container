import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import { signToken, verifyToken } from '@/lib/utils/tokens';
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
  if (!accessToken) {
    logger.warn('No access token found');
    return next();
  }
  const { decoded, valid, expired } = verifyToken(
    accessToken.toString(),
    'access',
  );
  if (decoded) {
    req.user = decoded;
    logger.info(`User: ${JSON.stringify(decoded)}`);
    return next();
  }
  const refDecoded =
    expired && refreshToken && verifyToken(refreshToken.toString(), 'refresh');

  if (!refDecoded) {
    logger.warn('No refresh token found');
    return next();
  }

  const { decoded: decodedRefresh } = refDecoded;

  if (!decodedRefresh) {
    logger.warn('No refresh token found');
    return next();
  }

  const { valid: validRefresh, expired: expiredRefresh } = verifyToken(
    refreshToken.toString(),
    'refresh',
  );

  if (!validRefresh || expiredRefresh) {
    logger.warn('Invalid refresh token');
    return next();
  }

  const { user } = decodedRefresh;
  logger.info(`User: ${JSON.stringify(user)}`);

  const newAccessToken = signToken({user}, 'access');
  const newRefreshToken = signToken({user}, 'refresh');

  req.user = decodedRefresh;
  if (!valid || expired) {
    logger.warn('Invalid access token');
    return next();
  }

  return next();
};
