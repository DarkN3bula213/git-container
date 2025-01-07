import { BadRequestError } from '@/lib/api/ApiError';
import { SuccessResponse } from '@/lib/api/ApiResponse';
import { accessCookie } from '@/lib/config/cookies';
import { getRoleFromMap } from '@/lib/constants/validCNIC';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger/logger';
import { notify } from '@/lib/utils/socketParser';
import { authService } from '../services/auth.service';

const logger = new Logger(__filename);

export const login = asyncHandler(async (req, res) => {
	const data = await authService.login(req.body.email, req.body.password);
	if (!data) {
		throw new BadRequestError('Invalid credentials');
	}

	res.cookie('access', data.accessToken, accessCookie);
	logger.info(`User ${data.user._id} logged in`);
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
