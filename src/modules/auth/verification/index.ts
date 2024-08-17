import asyncHandler from '@/lib/handlers/asyncHandler';
import { UserModel } from '../users/user.model';
import {
  sendResetPasswordEmail,
  sendResetSuccessEmail,
  sendSuccessMessage,
  sendWelcomeEmail,
} from '@/services/mail/mailTrap';
import { verfication } from '@/lib/utils/tokens';
import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import {
  BadRequestError,
  BadRequestResponse,
  SuccessResponse,
} from '@/lib/api';

const logger = new Logger(__filename);

export const verifyUser = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = await UserModel.findOne({
    verificationToken: code,
    verificationTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    return new BadRequestResponse('Invalid or expired verification code');
  }

  user.isVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpiresAt = null;
  await user.save();

  await sendWelcomeEmail(user.email, user.name);
  const userdat = {
    ...user,
    password: undefined,
  };
  new SuccessResponse('Email verified successfully', userdat).send(res);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(400).json({ success: false, message: 'User not found' });
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
    `${config.mail.url}/reset-password/${resetToken}`,
  );
  return new SuccessResponse('Password reset link sent to your email', {}).send(
    res,
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await UserModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpiresAt: { $gt: Date.now() },
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