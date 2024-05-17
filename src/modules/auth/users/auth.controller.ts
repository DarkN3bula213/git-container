import { cache } from '@/data/cache/cache.service';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { config } from '@/lib/config';
import { accessCookie, getCookieOption } from '@/lib/config/cookies';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { signToken } from '@/lib/utils/tokens';
import {
  fetchRoleCodes,
  isAdminRolePresent,
  normalizeRoles,
} from '@/lib/utils/utils';
import { UserModel } from './user.model';

const logger = new Logger(__filename);
export const login = asyncHandler(async (req, res) => {
  const user = await UserModel.login(req.body.email, req.body.password);
  if (!user) {
    throw new BadRequestError('Invalid credentials');
  }
  if (user) {
    const sessionData = {
      user: { id: user._id, username: user.username, isPremium: user.isPrime },
    };
    await cache.saveSession(req.sessionID, sessionData);
  } else {
    logger.error('User not found');
  }
  const verified = user.toObject();
  verified.password = undefined;
  const payload = {
    user: {
      ...verified,
      isPremium: verified.isPrime || false,
    },
  };

  const access = signToken(payload, 'access', {
    expiresIn: '120m',
  });

  res.cookie('access', access, getCookieOption('login'));

  const role = normalizeRoles(user.roles);

  const isAdmin = await isAdminRolePresent(role);

  return new SuccessResponse('Login successful', {
    user: verified,
    isAdmin,
  }).send(res);
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('access', {
    httpOnly: !config.isDevelopment,
    secure: !config.isDevelopment,
    domain: '/',
    sameSite: 'strict',
  });
  return new SuccessResponse('Logged out successfully', {}).send(res);
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new BadRequestError('No user found');
  }
  const roles = normalizeRoles(user.roles);

  const roleCodes = await fetchRoleCodes(roles);

  if (!roleCodes) {
    throw new BadRequestError('No user found');
  }

  const resp = {
    status: true,
    roles: roleCodes,
    user: user,
  };
  return new SuccessResponse('Logged in user', resp).send(res);
});
