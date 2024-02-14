import { sign, verify, SignOptions } from 'jsonwebtoken';
import dayjs from 'dayjs';

import { Logger as log } from '../logger/logger';
import { config } from '../config';
import { User, findUserById } from '@/modules/auth/users/user.model';
import { get } from 'lodash';

const logger = new log(__filename);

interface TokenPayload {
  user: User;
  session?: string;
}
interface TokenVerificationResult {
  valid: boolean;
  expired: boolean;
  decoded: TokenPayload | null;
}
export function signToken(
  payload: TokenPayload,
  key: 'access' | 'refresh',
  options?: SignOptions | undefined,
) {
  const signingKey = config.tokens[key].private;

  const token = sign(payload, signingKey, {
    ...(options && options),
    algorithm: 'RS256',
  });

  if (config.isDevelopment) {
    logger.warn({
      event: 'SignToken',
      details: {
        token,
        payload,
        signingKey,
        options,
      },
    });
  }

  return token;
}

export function verifyToken(
  token: string,
  key: 'access' | 'refresh',
): TokenVerificationResult {
  const verifyKey = config.tokens[key].public;

  try {
    const decoded = verify(token, verifyKey);

    if (config.isDevelopment) {
      logger.warn(`Payload: ${JSON.stringify(decoded)}`);
    }

    return {
      valid: true,
      expired: false,
      decoded: decoded as TokenPayload,
    };
  } catch (e: any) {
    let expired = false;
    let errorMessage = 'Invalid token';

    if (e.message === 'jwt expired') {
      expired = true;
      const expiredAt = dayjs(e.expiredAt);
      const now = dayjs();
      const formattedExpiryTime = expiredAt.format('YYYY-MM-DD HH:mm:ss');
      const timeAgo = now.diff(expiredAt, 'hour');
      errorMessage = `Token is expired since ${formattedExpiryTime} (${timeAgo} hours ago)`;
    }

    logger.error(`errorMessage: ${errorMessage}`);

    return {
      valid: false,
      expired,
      decoded: null,
    };
  }
}

export async function reIssueAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}) {
  const { decoded, valid, expired } = verifyToken(refreshToken, 'refresh');

  // Check for validity of the refresh token
  if (!valid) {
    logger.debug('Refresh token is invalid');
    return false;
  }

  // Check for expiry of the refresh token
  if (expired) {
    logger.debug('Refresh token has expired');
    return false;
  }

  if (decoded && decoded.user) {
    const verifiedUser = await findUserById(decoded.user._id);
    if (!verifiedUser) {
      logger.debug(`{
        event: 'UserNotFound',
        details: User ID: ${decoded.user._id} not found,
      }`);
      return false;
    }

    const accessToken = signToken(
      { user: verifiedUser },
      'access',
      { expiresIn: config.tokens.access.ttl }, // Adjust the TTL as necessary
    );

    logger.debug({
      event: 'AccessTokenCreated',
      userId: `${verifiedUser._id}`,
      expiresIn: `${config.tokens.access.ttl}`,
    });
    return accessToken;
  }

  // Log for invalid token or missing session within the decoded token
  if (!decoded || !get(decoded, 'session')) {
    logger.debug('Invalid token or session missing in refresh token');
    return false;
  }
}
