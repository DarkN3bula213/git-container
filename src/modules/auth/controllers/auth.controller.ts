import { BadRequestError } from '@/lib/api/ApiError';
import { SuccessResponse } from '@/lib/api/ApiResponse';
import { accessCookie, logoutCookie } from '@/lib/config/cookies';
import { getRoleFromMap } from '@/lib/constants/validCNIC';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger/logger';
import { notify } from '@/lib/utils/socketParser';
import { authService } from '../services/auth.service';
import { User } from '../users/user.model';

const logger = new Logger(__filename);

export const login = asyncHandler(async (req, res) => {
	const data = await authService.login(req.body.email, req.body.password);

	if (data.user.isVerified) {
		logger.debug('User is not verified');
	}
	res.cookie('access', data.accessToken, accessCookie);

	notify({
		event: 'incomingNotification',
		message: `${data.user.username} logged in`
	});

	return new SuccessResponse('Login successful', data).send(res);
});

export const register = asyncHandler(async (req, res) => {
	const { email, username, password, cnic, name } = req.body;

	const roleCode = getRoleFromMap(cnic);
	logger.info(`Creating user with role: ${roleCode}`);
	const data = await authService.register(
		{
			email,
			username,
			password,
			name
		},
		roleCode
	);
	const { user } = data;
	return new SuccessResponse(
		'User created',
		user.verificationTokenExpiresAt
	).send(res);
});

export const logout = asyncHandler(async (req, res) => {
	const user = req.user as User;
	notify({
		event: 'incomingNotification',
		message: `${user?.username} logged out`
	});
	res.clearCookie('access');
	res.cookie('access', '', logoutCookie);
	req.session.destroy((err) => {
		if (err) {
			throw new BadRequestError('Logout failed');
		}
		res.clearCookie('connect.sid'); // Clear the session cookie
		return new SuccessResponse('Logout successful', {}).send(res);
	});
});

export const getCurrentUser = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const data = await authService.getCurrentUser(user._id.toString());
	return new SuccessResponse('User fetched', data).send(res);
});

export const authController = {
	login,
	register,
	logout,
	getCurrentUser
};
