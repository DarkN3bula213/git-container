import { config } from '@/lib/config';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { reIssueAccessToken, verifyToken } from '@/lib/utils/tokens';

import { Request, Response, NextFunction } from 'express';

const logger = new Logger(__filename);

/**
 * A middleware function to require login for protected routes.
 *
 * TODO: The auth head may be removed in refactoring
 */

export const requireLogin = asyncHandler(async (req, res, next) => {
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

  if (decoded) {
    req.user = decoded;
    logger.info(`User authenticated: ${JSON.stringify(decoded)}`);
    return next();
  }

  // If token is expired and a refresh token exists, attempt to issue a new access token.
  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (!newAccessToken) {
      logger.debug(
        'Failed to re-issue access token with the provided refresh token.',
      );
      return next();
    }

    res.setHeader('x-access-token', newAccessToken);
    const result = verifyToken(newAccessToken as string, 'access');
    if (result.decoded) {
      req.user = result.decoded.user;
      logger.info(
        `New access token issued and user authenticated: ${JSON.stringify(result.decoded)}`,
      );
    }
    return next();
  }

  if (!valid) {
    logger.warn('Invalid access token, unable to authenticate.');
  } else if (expired) {
    logger.warn('Access token expired, please refresh token.');
  }

  return next();
});

