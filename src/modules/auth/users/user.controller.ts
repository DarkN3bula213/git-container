import asyncHandler from '@/lib/handlers/asyncHandler';
import { User, UserModel } from './user.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { signToken } from '@/lib/utils/tokens';
import { Roles } from '@/lib/constants';
import {
  clearAuthCookies,
  fetchRoleCodes,
  isAdminRolePresent,
  normalizeRoles,
} from '@/lib/utils/utils';
import { convertToMilliseconds } from '@/lib/utils/fns';
import { cache } from '@/data/cache/cache.service';
import { Logger } from '@/lib/logger/logger';

const logger = new Logger(__filename);

/*<!-- 1. Read  ---------------------------( getUsers )-> */
export const getUsers = asyncHandler(async (req, res) => {
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

  const response = {
    status: true,
    roles: roleCodes,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
  };
  return new SuccessResponse('Logged in user', response).send(res);
});

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
  delete userObj.password;

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
  if (!user) res.status(400).json({ success: false });
  res.status(200).json({
    success: true,
    data: user,
  });
});

/*<!-- 2. Delete  ---------------------------( deleteMany )-> */
export const reset = asyncHandler(async (req, res) => {
  const user = await UserModel.deleteMany({});
  res.status(200).json({
    success: true,
    data: user,
  });
});

/*--- 3. Delete -----------------------------(deleteUserById)-> */
export const deleteUserById = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndDelete(req.params._id);
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
  if (user) {
    
    const sessionData = {
      user: { id: user.id, username: user.username, isPremium: user.isPrime },
    };
   const save = await cache.saveSession(req.sessionID, sessionData);
    
  } else {
    logger.error('User not found');
  }
  const verified = user.toObject();
  delete verified.password;
  const payload = {
    user: {
      ...verified,
      isPremium: verified.isPrime || false,
    },
  };

 
  const access = signToken(payload, 'access', {
    expiresIn: '120m',
  });

  res.cookie('access', access, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.hps-admin.com',
    maxAge: convertToMilliseconds('2h'),
  });

  const role = normalizeRoles(user.roles);

  const isAdmin = await isAdminRolePresent(role);

  return new SuccessResponse('Login successful', {
    user: verified,
    isAdmin,
  }).send(res);
});

/** -----------------------------( Authentication )->
 *
 ** -----------------------------( logout )->
 */

export const logout = asyncHandler(async (req, res) => {
  cache
    .deleteSession(req.sessionID)
    .then(() => {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).send('Failed to logout');
        }
        clearAuthCookies(res);
        res.send('Logout successful');
      });
    })
    .catch((error) => {
      logger.error('Session deletion failed:', error);
      res.status(500).send('Internal Server Error');
    });
});

export const isAdmin = asyncHandler(async (req, res) => {
  return new SuccessResponse('User is admin', {}).send(res);
});

/** -----------------------------( Authentication )->
 *
 ** -----------------------------( check session´ )->
 */

export const checkSession = asyncHandler(async (req, res) => {
  const sessionData = await cache.getSession(req.sessionID);
  if (sessionData && sessionData.user) {
    return new SuccessResponse('Session is active', sessionData.user).send(res);
  }
  return new BadRequestError('Session is inactive');
});
