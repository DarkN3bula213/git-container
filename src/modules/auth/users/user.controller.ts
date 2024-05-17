import { BadRequestError, SuccessResponse } from '@/lib/api';
import { Roles } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { RoleModel } from '../roles/role.model';
import { type User, UserModel, checkForUserNameAndEmail } from './user.model';

/*<!-- 1. Read  ---------------------------( getUsers )-> */
export const getUsers = asyncHandler(async (_req, res) => {
  const users = await UserModel.find();
  if (!users) return new BadRequestError('No users found');
  res.status(200).json({
    success: true,
    data: users,
  });
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

/*<!-- 4. Read  ---------------------------( getUserById )-> */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.params._id);
  if (!user) res.status(400).json({ success: false });
  res.status(200).json({
    success: true,
    data: user,
  });
});

/*<!-- 1. Create  ---------------------------( createUser )-> */
export const register = asyncHandler(async (req, res) => {
  const check = await UserModel.findUserByEmail(req.body.email);
  if (check) {
    throw new BadRequestError('User with this email already exists');
  }

  const user = await UserModel.createUser(req.body, Roles.READONLY);
  if (!user) {
    throw new BadRequestError('Something went wrong');
  }
  const userObj = user.toObject();
  userObj.password = undefined;

  res.status(200).json({
    success: true,
    data: userObj,
  });
});

/*<!-- 2. Create  ---------------------------( insertMany )-> */
export const insertMany = asyncHandler(async (req, res) => {
  const users = await UserModel.insertMany(req.body);
  res.status(200).json({
    success: true,
    data: users,
  });
});

/*<!-- 3. Create  ---------------------------( createTempUser )-> */
export const createTempUser = asyncHandler(async (req, res) => {
  const check = await checkForUserNameAndEmail(
    req.body.username,
    req.body.email,
  );
  if (check) {
    throw new BadRequestError('User with this email already exists');
  }
  const { username, email, password, name } = req.body;

  const role = await RoleModel.findOne({ code: Roles.READONLY });
  if (!role) {
    throw new BadRequestError('Role not found');
  }
  const user = new UserModel({
    username: username,
    email: email,
    password: password,
    name: name,
    temporary: Date.now(),
    isPrime: false,
    roles: role._id,
    expireAt: new Date(Date.now()),
  }) as User;
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

/*<!-- 1. Delete  ---------------------------( deleteUser )-> */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndDelete(req.params.id);
  if (!user) return res.status(400).json({ success: false });
  res.status(200).json({
    success: true,
    data: user,
  });
});

/*<!-- 2. Delete  ---------------------------( deleteMany )-> */
export const reset = asyncHandler(async (_req, res) => {
  const user = await UserModel.deleteMany({});
  res.status(200).json({
    success: true,
    data: user,
  });
});
