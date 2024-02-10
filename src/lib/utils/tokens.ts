import { sign, verify, SignOptions } from 'jsonwebtoken';
import fs from 'fs';

import { Logger as log } from '../logger/logger';
import { config } from '../config';
import { User } from '@/modules/auth/users/user.model';

const Logger = new log(__filename);

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
    // Logger.warn(`Token signed with ${key} key`);
    // Logger.warn(`Token: ${token}`);
    Logger.warn(`Payload: ${JSON.stringify(payload)}`);
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
      // Logger.warn(`Token verified with ${key} key`);
      // Logger.warn(`Token: ${token}`);
      Logger.warn(`Payload: ${JSON.stringify(decoded)}`);
    }
    return {
      valid: true,
      expired: false,
      decoded: decoded as TokenPayload,
    };
  } catch (e: any) {
    Logger.error(e);
    return {
      valid: false,
      expired: e.message === 'Token expired',
      decoded: null,
    };
  }
}
