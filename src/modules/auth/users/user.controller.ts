import asyncHandler from '@/lib/handlers/asyncHandler';
import { User, UserModel } from './user.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';

import { Logger } from '@/lib/logger';
import { signToken } from '@/lib/utils/tokens';
import { Roles } from '@/lib/constants';
import { config } from '@/lib/config';
import { convertToMilliseconds } from '@/lib/utils/fns';
import IssueModel from '@/modules/school/issues/issue.model';
const logger = new Logger(__filename);
export const getUsers = asyncHandler(async (req, res) => {
  const users = await UserModel.find();
  if (!users) return new BadRequestError('No users found');
  res.status(200).json({
    success: true,
    data: users,
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) res.status(400).json({ success: false });
  res.status(200).json({
    success: true,
    data: user,
  });
});

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

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndDelete(req.params.id);
  if (!user) res.status(400).json({ success: false });
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const register = asyncHandler(async (req, res) => {
  const check = await UserModel.findUserByEmail(req.body.email);
  if (check) {
    throw new BadRequestError('User with this email already exists');
  }

  const user = await UserModel.createUser(req.body, Roles.HPS);
  if (!user) {
    throw new BadRequestError('Something went wrong');
  }

  const access = signToken({ user }, 'access', {
    expiresIn: '5m',
  });

  const refresh = signToken({ user }, 'refresh', {
    expiresIn: '30m',
  });
 
  // logger.debug({
  //   Keystore: userDetails,
  // });

  res.status(200).json({
    success: true,
    data: user,
    tokens: { access, refresh },
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await UserModel.login(req.body.email, req.body.password);
  if (!user) {
    throw new BadRequestError('Invalid credentials');
  }

  const verified = user.toObject();
  delete verified.password;

  const access = signToken({ user }, 'access', {
    expiresIn: -1,
  });
  const refresh = signToken({ user }, 'refresh', {
    expiresIn: config.tokens.refresh.ttl,
  });

  // res.cookie('refreshToken', refresh, {
  //   maxAge: 1000 * 60 * 60 * 2, // 2 hours
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: 'none',

  // });
  res.cookie('accessToken', access, {
    maxAge: 900000, // 15 mins
    httpOnly: true,

    sameSite: 'none',
    secure: true,
  });

  res.cookie('refreshToken', refresh, {
    maxAge: 1000 * 60 * 60 * 24, // 1  day
    httpOnly: true,

    sameSite: 'none',
    secure: false,
  });

  return new SuccessResponse('Login successful', {
    access,
    refresh,
    user: verified,
  }).send(res);
});

export const insertMany = asyncHandler(async (req, res) => {
  const users = await UserModel.insertMany(req.body);
  res.status(200).json({
    success: true,
    data: users,
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user as User;

  if (!user) {
    throw new BadRequestError('No user found');
  }
  return new SuccessResponse('Logged in user', user).send(res);
});
export const reset = asyncHandler(async (req, res) => {
  const user = await UserModel.deleteMany({});
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const logout = asyncHandler(async (req, res) => {
  logger.debug('logout');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
