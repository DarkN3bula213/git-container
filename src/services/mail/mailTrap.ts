import { Logger } from '@/lib/logger';
import sendEmail from '.';
import { BadRequestError } from '@/lib/api';

const logger = new Logger(__filename);

export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const response = await sendEmail({
      to: email,
      subject: 'Welcome to HPS Admin',
      templateName: 'success',
      templateData: { username: name },
    });

    console.log('Welcome email sent successfully', response);
  } catch (error) {
    console.error(`Error sending welcome email`, error);

    throw new Error(`Error sending welcome email: ${error}`);
  }
};

export const sendVerifyEmail = async (
  name: string,
  email: string,
  token: string,
) => {
  try {
    const emailRes = await sendEmail({
      to: email,
      subject: 'Verification Email',
      templateName: 'verfifation',
      templateData: { verificationCode: token },
      name: name,
    });
    logger.debug(JSON.stringify(emailRes));
  } catch (error) {
    if (typeof error === 'string') {
      logger.error(`Email delivery failed: ${error}`);
      throw new BadRequestError(error);
    } else {
      throw new BadRequestError('Sending verificaiont email failed');
    }
  }
};

export const sendResetPasswordEmail = async (email: string, url: string) => {
  try {
    const emailRes = await sendEmail({
      to: email,
      subject: 'Reset Password',
      templateName: 'reset',
      templateData: { resetURL: url },
    });
    logger.debug(JSON.stringify(emailRes));
  } catch (error) {
    if (typeof error === 'string') {
      logger.error(`Email delivery failed: ${error}`);
      throw new BadRequestError(error);
    } else {
      throw new BadRequestError('Sending verificaiont email failed');
    }
  }
};
export const sendSuccessMessage = async (email: string, url: string) => {
  try {
    const emailRes = await sendEmail({
      to: email,
      subject: 'Reset Password',
      templateName: 'reset',
      templateData: { resetURL: url },
    });
    logger.debug(JSON.stringify(emailRes));
  } catch (error) {
    if (typeof error === 'string') {
      logger.error(`Email delivery failed: ${error}`);
      throw new BadRequestError(error);
    } else {
      throw new BadRequestError('Email failed');
    }
  }
};

export const sendResetSuccessEmail = async (email: string) => {
  try {
    const response = await sendEmail({
      to: email,
      subject: 'Password Reset Successful',
      templateName: 'success',
    });

    console.log('Password reset email sent successfully', response);
  } catch (error) {
    console.error(`Error sending password reset success email`, error);

    throw new Error(`Error sending password reset success email: ${error}`);
  }
};

export const sendEmailVerified = async (email: string) => {
  try {
    const response = await sendEmail({
      to: email,
      subject: 'Verification Successful',
      templateName: 'emailVerified',
    });

    console.log('Password reset email sent successfully', response);
  } catch (error) {
    console.error(`Error sending password reset success email`, error);
    throw new Error(`Error sending password reset success email: ${error}`);
  }
};
