import { AuthFailureError } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger as l } from '@/lib/logger';
import { reIssueAccessToken, verifyToken } from '@/lib/utils/tokens';

import { get } from 'lodash';


const logger = new l(__filename);

export const authenticate = asyncHandler(async (req, res, next) => {
  const accessToken = req.headers['x-access-token'];
  console.log(req.cookies)
  const refreshToken = get(req, "cookies.refreshToken" )||req.headers['x-refresh-token'];

  const access = req.cookies.access;
  const refresh = req.cookies.refresh;


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
 
    return next();
  }

  // If token is expired and a refresh token exists, attempt to issue a new access token.
  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken:refreshToken.toString() });

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
 
      return next();
    }
  }

  if (!valid || expired) {
    logger.warn('Invalid or expired access token, unable to authenticate.');
    return res.status(403).json({ message: 'Invalid or expired access token' });
  }

  return next();
});
