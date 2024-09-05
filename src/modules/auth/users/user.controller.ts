import { cache } from '@/data/cache/cache.service';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { config } from '@/lib/config';
import { accessCookie, logoutCookie } from '@/lib/config/cookies';
import { Roles } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger/logger';
import { convertToMilliseconds } from '@/lib/utils/fns';
import { signToken } from '@/lib/utils/tokens';
import {
  fetchRoleCodes,
  fetchUserPermissions,
  isAdminRolePresent,
  normalizeRoles,
} from '@/lib/utils/utils';
import { type User, UserModel } from './user.model';
import { service } from './user.service';
import { sendVerifyEmail } from '@/services/mail/mailTrap';
import { getRoleFromMap } from '@/lib/constants/validCNIC';

const logger = new Logger(__filename);
// import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}
/*<!-- 1. Read  ---------------------------( getUsers )-> */
export const getUsers = asyncHandler(async (_req, res) => {
  const users = await UserModel.find().populate('roles').exec();
  if (!users) return new BadRequestError('No users found');
  return new SuccessResponse('Users found', users).send(res);
});

/*<!-- 2. Read  ---------------------------( getUser )-> */
export const getUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) res.status(400).json({ success: false });
  res.status(200).json({
    success: true,
    data: user,
  });
});

/*<!-- 3. Read  ---------------------------( getCurrentUser )-> */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user as User;

  if (!user) {
    throw new BadRequestError('No user found');
  }
  const roles = normalizeRoles(user.roles);

  const roleCodes = await fetchRoleCodes(roles);

  if (!roleCodes) {
    throw new BadRequestError('No user found');
  }

  const resp: { status: boolean; roles: string[]; user: User } = {
    status: true,
    roles: roleCodes,
    user: user,
  };
  return new SuccessResponse('Logged in user', resp).send(res);
});

/*<!-- 4. Read  ---------------------------( getUserById )-> */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.params._id);
  if (!user) {
    throw new BadRequestError('No user found');
  }
  return new SuccessResponse('User found', user).send(res);
});

/*<!-- 1. Create  ---------------------------( createUser )-> */
export const register = asyncHandler(async (req, res) => {
  const { email, username, password, cnic } = req.body;

  const roleCode = getRoleFromMap(cnic);
  logger.info({
    role: roleCode,
  });
  const data = await service.createUser(
    {
      email,
      username,
      password,
    },
    roleCode,
  );
  const { user, token } = data;
  await sendVerifyEmail(user.name, user.email, token);
  return new SuccessResponse('User created', user).send(res);
});

/*<!-- 3. Create  ---------------------------( createTempUser )-> */
export const createTempUser = asyncHandler(async (req, res) => {
  const check = await UserModel.findUserByEmail(req.body.email);
  if (check) {
    throw new BadRequestError('User with this email already exists');
  }
  const { username, email, password, name, dob } = req.body;
  const user = new UserModel({
    username: username,
    email: email,
    password: password,
    name: name,
    temporary: Date.now(),
    isPrime: false,
    dob: dob,
  });
  await user.save();
  return new SuccessResponse('User created successfully', user).send(res);
});

/*<!-- 1. Update  ---------------------------( updateUser )-> */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!user) res.status(400).json({ success: false });
  res.status(200).json({
    success: true,
    data: user,
  });
});
/*<!-- 2. Update  ---------------------------( Change Password )-> */
export const changePassword = asyncHandler(async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  if (!userId || !oldPassword || !newPassword) {
    return new BadRequestError('Missing required fields');
  }
  if (oldPassword === newPassword) {
    return new BadRequestError(
      'New password cannot be the same as old password',
    );
  }
  const reqUser = req.user as User;
  if (reqUser.id !== userId) {
    return new BadRequestError(
      'You are not authorized to change this password',
    );
  }

  const user = await UserModel.changePassword(userId, oldPassword, newPassword);
  return new SuccessResponse('Password changed successfully', user).send(res);
});

/*<!-- 1. Delete  ---------------------------( deleteUser )-> */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const user = await UserModel.findByIdAndDelete({
    _id: id,
  });
  if (!user) res.status(400).json({ success: false });
  res.status(200).json({
    success: true,
    data: user,
  });
});

/** -----------------------------( Authentication )->
 *
 ** -----------------------------( login )->
 */

export const login = asyncHandler(async (req, res) => {
  const user = await UserModel.login(req.body.email, req.body.password);
  if (!user) {
    throw new BadRequestError('Invalid credentials');
  }

  req.session.userId = user._id;
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
  req.session.cookie.expires = new Date(Date.now() + 120 * 60 * 1000);

  user.lastLogin = new Date();
  await user.save();
  res.cookie('access', access, accessCookie);

  const role = normalizeRoles(user.roles);

  const isAdmin = await isAdminRolePresent(role);

  const roleCodes = (await fetchUserPermissions(role)) as string[];

  return new SuccessResponse('Login successful', {
    user: verified,
    isAdmin,
    permissions: [...roleCodes],
  }).send(res);
});

/** -----------------------------( Authentication )->
 *
 ** -----------------------------( logout )->
 */

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('access');
  res.cookie('access', '', logoutCookie);
  req.session.destroy(() => {
    res.send('User logged out, session destroyed');
  });
});

/*
 *
 *
 *
 */ /** -----------------------------( Archieved )->

/*<!-- Create  ---------------------------( insertMany )-> **
export const insertMany = asyncHandler(async (req, res) => {
  const users = await UserModel.insertMany(req.body);
  res.status(200).json({
    success: true,
    data: users,
  });
});

/*<!-- 2. Delete  ---------------------------( deleteMany )-> /*
export const reset = asyncHandler(async (_req, res) => {
  const user = await UserModel.deleteMany({});
  res.status(200).json({
    success: true,
    data: user,
  });
});


export const checkLogin = asyncHandler(async (req, res) => {
  const user = req.user as User;
  if (!user) {
    throw new BadRequestError('No user found');
  }

  const roles = normalizeRoles(user.roles);

  const isAdmin = await isAdminRolePresent(roles);

  const roleCodes = await fetchUserPermissions(roles);

  const data: IDATA = {
    user: user,
    roles: [...roleCodes],
    isAdmin: isAdmin,
    isLoggedIn: true,
  };

  return new SuccessResponse('User is logged in', data).send(res);
});

type IDATA = {
  user: User;
  roles: string[];
  isAdmin: boolean;
  isLoggedIn: boolean;
};


export const isAdmin = asyncHandler(async (_req, res) => {
  return new SuccessResponse('User is admin', {}).send(res);
});


export const checkSession = asyncHandler(async (req, res) => {
  const sessionData = await cache.getSession(req.sessionID);
  if (sessionData?.user) {
    return new SuccessResponse('Session is active', sessionData.user).send(res);
  }
  return new BadRequestError('Session is inactive');
});
*/
