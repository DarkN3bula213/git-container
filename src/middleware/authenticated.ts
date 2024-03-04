import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger as l } from '@/lib/logger';
import { reIssueAccessToken, verifyToken } from '@/lib/utils/tokens';

import { get } from 'lodash';

const logger = new l(__filename);

export const authenticate = asyncHandler(async (req, res, next) => {
  const accessToken = get(req, 'cookies.accessToken');
  const refreshToken = get(req, 'cookies.refreshToken');
  if (!accessToken) {
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

  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({
      refreshToken: refreshToken.toString(),
    });

    if (!newAccessToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = verifyToken(newAccessToken, 'access');
    if (result.decoded) {
      req.user = result.decoded.user;
      return next();
    }
  }

  if (!valid || expired) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return next();
});
