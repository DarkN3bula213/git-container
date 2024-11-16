import { convertToObjectId } from '@/data/database/db.utils';
import {
	BadRequestError,
	BadRequestResponse,
	SuccessResponse
} from '@/lib/api';
import { config } from '@/lib/config';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { verfication } from '@/lib/utils/tokens';
import {
	sendEmailVerified,
	sendResetPasswordEmail,
	sendResetSuccessEmail,
	sendVerifyEmail
} from '@/services/mail/mailTrap';
import { UserModel } from '../users/user.model';
import { service } from '../users/user.service';

const logger = new Logger(__filename);

export const verifyUser = asyncHandler(async (req, res) => {
	const { code } = req.body;
	const user = await UserModel.findOne({
		verificationToken: code,
		verificationTokenExpiresAt: { $gt: Date.now() }
	});

	if (!user) {
		return new BadRequestResponse('Invalid or expired verification code');
	}

	// Check if user is already verified
	if (user.isVerified) {
		return new BadRequestResponse('User already verified');
	}

	user.isVerified = true;
	user.verificationToken = null;
	user.verificationTokenExpiresAt = null;
	await user.save();

	await sendEmailVerified(user.email);
	const userdat = {
		...user,
		password: undefined
	};
	new SuccessResponse('Email verified successfully', userdat).send(res);
});

export const forgotPassword = asyncHandler(async (req, res) => {
	const { email } = req.body;
	const user = await UserModel.findOne({ email });

	if (!user) {
		return res
			.status(400)
			.json({ success: false, message: 'User not found' });
	}

	// Generate reset token
	const resetToken = verfication.resetToken();
	logger.debug(resetToken);
	const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

	user.resetPasswordToken = resetToken;
	user.resetPasswordExpiresAt = resetTokenExpiresAt;

	await user.save();

	// send email
	await sendResetPasswordEmail(
		user.email,
		`${config.mail.url}reset-password/${resetToken}`
	);
	return new SuccessResponse(
		'Password reset link sent to your email',
		{}
	).send(res);
});

export const resetPassword = asyncHandler(async (req, res) => {
	const { token } = req.params;
	const { password } = req.body;

	const user = await UserModel.findOne({
		resetPasswordToken: token,
		resetPasswordExpiresAt: { $gt: Date.now() }
	});

	if (!user) {
		return new BadRequestError('Invalid or expired reset token');
	}

	// update password

	user.password = password;
	user.resetPasswordToken = null;
	user.resetPasswordExpiresAt = null;
	await user.save();

	await sendResetSuccessEmail(user.email);
	return new SuccessResponse('Password reset successful', {}).send(res);
});

export const reissueEmailVerificationToken = asyncHandler(async (req, res) => {
	const { email } = req.body;
	const user = await UserModel.findOne({ email });
	if (!user) {
		throw new BadRequestError('User not found');
	}
	const token = verfication.generateToken();
	const expiry = verfication.expiry;
	const userData = {
		verificationToken: token,
		verificationTokenExpiresAt: expiry
	};
	await UserModel.findByIdAndUpdate(user._id, userData);
	await sendVerifyEmail(user.username, email, token);
	return new SuccessResponse('Email verification sent', {}).send(res);
});

export const registeredUserVerification = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const user = await UserModel.findOne({ email });
	if (!user) {
		throw new BadRequestError('User not found');
	}

	// Check if user is already verified
	if (user.isVerified) {
		throw new BadRequestError('User already verified');
	}

	const data = await service.generateVerificationToken(email, password);
	await sendVerifyEmail(user.username, email, data.token);
	return new SuccessResponse('Email verification sent', data).send(res);
});

export const toggleApproval = asyncHandler(async (req, res) => {
	const userId = req.params.userId;
	const id = convertToObjectId(userId);

	const user = await UserModel.findById(id);
	if (!user) {
		throw new BadRequestError('Bad request');
	}
	user.isApproved = !user.isApproved;
	await user.save();

	return new SuccessResponse('Status changed', { user }).send(res);
});
