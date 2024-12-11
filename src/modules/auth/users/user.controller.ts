import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { convertToObjectId } from '@/data/database/db.utils';
import { BadRequestError, SuccessResponse } from '@/lib/api';

/** -----------------------------( Authentication )->
 *
 ** -----------------------------( login )->
 */
import { accessCookie, logoutCookie } from '@/lib/config/cookies';
import { Roles } from '@/lib/constants';
import { getRoleFromMap } from '@/lib/constants/validCNIC';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger/logger';
import { notify } from '@/lib/utils/socketParser';
import { signToken } from '@/lib/utils/tokens';
import {
	fetchRoleCodes,
	fetchUserPermissions,
	isAdminRolePresent,
	normalizeRoles
} from '@/lib/utils/utils';
import Role, { RoleModel } from '@/modules/auth/roles/role.model';
import userSettingsService from '../settings/settings.service';
import { type User, UserModel } from './user.model';
import { service } from './user.service';

const logger = new Logger(__filename);
// import session from 'express-session';

declare module 'express-session' {
	interface SessionData {
		userId?: string;
		username?: string;
		email?: string;
		roles?: string[];
		lastLogin?: Date;
	}
}
/*<!-- 1. Read  ---------------------------( getUsers )-> */
export const getUsers = asyncHandler(async (_req, res) => {
	// const users = await UserModel.find().populate('roles').exec();
	// if (!users) return new BadRequestError('No users found');
	// Map the admin roles to admins
	// Example context: Inside a controller or service function
	const adminRole = (await RoleModel.findOne({
		code: Roles.ADMIN
	})) as Role;
	if (!adminRole) {
		throw new BadRequestError('No admin roles found');
	}

	const users = (await UserModel.find().populate<{ roles: Role[] }>({
		path: 'roles',
		select: 'code'
	})) as unknown as User[];
	if (!users) {
		throw new BadRequestError('No users found');
	}

	return new SuccessResponse('Users found', users).send(res);
});

/*<!-- 2. Read  ---------------------------( getUser )-> */
export const getUser = asyncHandler(async (req, res) => {
	const user = await UserModel.findById(req.params.id);
	if (!user) res.status(400).json({ success: false });
	res.status(200).json({
		success: true,
		data: user
	});
});

/*<!-- 3. Read  ---------------------------( getCurrentUser )-> */
export const getCurrentUser = asyncHandler(async (req, res) => {
	const user = req.user as User;

	const id = user._id?.toString();
	if (!id) {
		throw new BadRequestError('No user found');
	}
	const key = getDynamicKey(DynamicKey.USER, id);
	const userCache = await cache.getWithFallback(key, async () => {
		return await UserModel.findById(id)
			.select('-password') // Method 1: Exclude password at query level
			.lean()
			.exec();
	});

	if (!userCache) {
		throw new BadRequestError('No user found');
	}
	const roles = normalizeRoles(userCache.roles);
	const roleCodes = (await fetchRoleCodes(roles)) as string[];
	const isAdmin = await isAdminRolePresent(roles);

	if (!roleCodes) {
		throw new BadRequestError('No user found');
	}

	return new SuccessResponse('Logged in user', {
		user: userCache, // Send user without password
		isAdmin,
		isVerified: userCache.isVerified || false,
		permissions: roleCodes
	}).send(res);
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
	const { email, username, password, cnic, name } = req.body;

	const roleCode = getRoleFromMap(cnic);
	logger.info({
		role: roleCode
	});
	const data = await service.createUser(
		{
			email,
			username,
			password,
			name
		},
		roleCode
	);
	const { user } = data;
	// await sendVerifyEmail(user.name, user.email, token);
	return new SuccessResponse(
		'User created',
		user.verificationTokenExpiresAt
	).send(res);
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
		dob: dob
	});
	await user.save();
	return new SuccessResponse('User created successfully', user).send(res);
});

/*<!-- 1. Update  ---------------------------( updateUser )-> */
export const updateUser = asyncHandler(async (req, res) => {
	const userId = req.params.id;
	const user = req.user as User;
	if (userId !== user?._id?.toString()) {
		return new BadRequestError(
			'You are not authorized to update this user'
		);
	}
	const updateData = req.body;
	const updatedUser = await service.updateUser(userId, updateData);
	return new SuccessResponse('User updated successfully', updatedUser).send(
		res
	);
});
/*<!-- 2. Update  ---------------------------( Change Password )-> */
export const changePassword = asyncHandler(async (req, res) => {
	const { userId, oldPassword, newPassword } = req.body;

	const reqUser = req.user as User;
	if (reqUser._id !== userId) {
		return new BadRequestError(
			'You are not authorized to change this password'
		);
	}
	const user = await service.changePassword(userId, oldPassword, newPassword);
	return new SuccessResponse('Password changed successfully', user).send(res);
});

/*<!-- 1. Delete  ---------------------------( deleteUser )-> */
export const deleteUser = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const user = await UserModel.findByIdAndDelete({
		_id: id
	});
	if (!user) res.status(400).json({ success: false });
	res.status(200).json({
		success: true,
		data: user
	});
});

// Login Controller
export const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const user = await UserModel.login(email, password);

	if (!user) {
		throw new BadRequestError('Invalid credentials');
	}

	const verifiedUser = user.toObject();
	verifiedUser.password = undefined;

	const payload = {
		user: {
			...verifiedUser,

			isPremium: verifiedUser.isPrime || false
		}
	};

	const access = signToken(payload, 'access', { expiresIn: '120m' });

	// Store user data in session
	req.session.userId = user._id?.toString();
	req.session.username = user.username;

	// Optional: Update last login
	user.lastLogin = new Date();
	await user.save();

	// Send back JWT as an additional security layer if needed
	res.cookie('access', access, accessCookie);

	const role = normalizeRoles(user.roles);
	const isAdmin = await isAdminRolePresent(role);
	const userSettings = await userSettingsService.getSettings(
		convertToObjectId(verifiedUser._id)
	);

	logger.info({
		message: 'isAdmin',
		isAdmin: isAdmin
	});

	const roleCodes = (await fetchUserPermissions(role)) as string[];
	notify({
		event: 'incomingNotification',
		message: `${verifiedUser.username} logged in`
	});

	const dataObject = {
		user: verifiedUser,
		isAdmin,
		isVerified: verifiedUser.isVerified || false,
		permissions: roleCodes,
		settings: userSettings
	};

	// eslint-disable-next-line no-console
	console.log(dataObject, { depth: null });

	return new SuccessResponse('Login successful', dataObject).send(res);
});

/** -----------------------------( Authentication )->
 *
 ** -----------------------------( logout )->
 */

export const logout = asyncHandler(async (req, res) => {
	const user = req.user as User;
	notify({
		event: 'incomingNotification',
		message: `${user.username} logged out`
	});
	res.clearCookie('access');
	res.cookie('access', '', logoutCookie);
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).json({ message: 'Logout failed' });
		}
		res.clearCookie('connect.sid'); // Clear the session cookie
		return res.status(200).json({ message: 'Logout successful' });
	});
});

// Controller to check availability of email | username
export const checkAvailability = asyncHandler(async (req, res) => {
	const { email, username } = req.query;

	if (!email && !username) {
		throw new BadRequestError('Email or username is required');
	}

	const response: { email?: boolean; username?: boolean } = {};

	if (email) {
		const emailExists = await UserModel.findOne({ email });
		response.email = !emailExists; // true if email is available
	}

	if (username) {
		const usernameExists = await UserModel.findOne({ username });
		response.username = !usernameExists; // true if username is available
	}

	return new SuccessResponse('Availability checked', response).send(res);
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
