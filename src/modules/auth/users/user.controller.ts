import asyncHandler from '@/lib/handlers/asyncHandler';
import { UserModel } from './user.model';
import { BadRequestError } from '@/lib/api';
import { Keystore } from '../keyStore/keyStore.model';
import { Logger } from '@/lib/logger';
import { signToken } from '@/lib/utils/tokens';
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
  const user = await UserModel.createUser(req.body);

  const access = signToken({ user }, 'access', {
    expiresIn: '5m', // Adjust token expiration as needed
  })

    const refresh = signToken({ user }, 'refresh', {
      expiresIn: '30m', // Adjust token expiration as needed
    })
    const userDetails = await Keystore.createKeystore(user, access, refresh);

    // logger.debug({
    //   Keystore: userDetails,
    // });

  res.status(200).json({
    success: true,
    data: user,
    tokesn: { access, refresh },
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await UserModel.login(req.body.email, req.body.password);
  if (!user) {
    throw new BadRequestError('Invalid credentials');
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const insertMany = asyncHandler(async (req, res) => {
  const users = await UserModel.insertMany(req.body);
  res.status(200).json({
    success: true,
    data: users,
  });
});


export const reset = asyncHandler(async (req, res) => {
  const user = await UserModel.deleteMany({});
  res.status(200).json({
    success: true,
    data: user,
  });
})