import { BadRequestError } from '@/lib/api';
import { Logger } from '@/lib/logger';
import { writeFileSync } from 'fs';
import sendEmail, { generateHtmlTemplate } from '.';
import { getPaymentsForDate } from '../cron/daily-fees';
import template from './mailTemplates';

const logger = new Logger(__filename);

export const sendWelcomeEmail = async (email: string, name: string) => {
	try {
		await sendEmail({
			to: email,
			subject: 'Welcome to HPS Admin',
			templateName: 'success',
			templateData: { username: name }
		});
	} catch (error) {
		console.error(`Error sending welcome email`, error);

		throw new Error(`Error sending welcome email: ${error}`);
	}
};

export const sendVerifyEmail = async (
	name: string,
	email: string,
	token: string
) => {
	try {
		const emailRes = await sendEmail({
			to: email,
			subject: 'Verification Email',
			templateName: 'verfifation',
			templateData: { verificationCode: token },
			name: name
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

export const reissueVerificationCodeEmail = async (
	name: string,
	email: string,
	token: string
) => {
	logger.info({ name, email, token });
	try {
		await sendEmail({
			to: email,
			subject: 'Reissue Verification Token',
			templateName: 'reissueVerificationToken',
			templateData: { verificationCode: token, username: name },
			name: name
		});
	} catch (error) {
		if (typeof error === 'string') {
			logger.error(`Email delivery failed: ${error}`);
			throw new BadRequestError(error);
		} else {
			throw new BadRequestError(
				'Sending reissue verification token email failed'
			);
		}
	}
};

export const sendResetPasswordEmail = async (email: string, url: string) => {
	try {
		const emailRes = await sendEmail({
			to: email,
			subject: 'Reset Password',
			templateName: 'reset',
			templateData: { resetURL: url }
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
			templateData: { resetURL: url }
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
		await sendEmail({
			to: email,
			subject: 'Password Reset Successful',
			templateName: 'success'
		});
	} catch (error) {
		console.error(`Error sending password reset success email`, error);

		throw new Error(`Error sending password reset success email: ${error}`);
	}
};

export const emailVerificationSuccess = async (email: string) => {
	try {
		await sendEmail({
			to: email,
			subject: 'Verification Successful',
			templateName: 'emailVerified'
		});
	} catch (error) {
		console.error(`Error sending password reset success email`, error);
		throw new Error(`Error sending password reset success email: ${error}`);
	}
};

export const sendDailyReport = async () => {
	try {
		await sendEmail({
			to: 'info@hps.com',
			subject: 'Daily Report',
			templateName: 'dailyPaymentReport',
			templateData: {
				date: new Date().toLocaleDateString(),
				totalAmount: (1000).toLocaleString()
			}
		});
	} catch (error) {
		console.error(`Error sending password reset success email`, error);
		throw new Error(`Error sending password reset success email: ${error}`);
	}
};

export async function generatePaymentEmail(date: Date): Promise<string> {
	const payments = await getPaymentsForDate(date);
	const formattedDate = new Date(date).toDateString();
	const totalRevenue = payments.reduce(
		(sum, payment) => sum + payment.totalAmount,
		0
	);
	const classSectionsHtml = payments
		.map((payment) => {
			const studentRowsHtml = payment.students
				.map((student) =>
					template.studentRow
						.replace('{studentName}', student.studentName)
						.replace('{payId}', student.payId)
						.replace('{amount}', student.amount.toFixed(2))
				)
				.join('');

			return template.classSection
				.replace('{className}', payment.className)
				.replace('{section}', payment.section)
				.replace('{studentRows}', studentRowsHtml)
				.replace('{totalAmount}', payment.totalAmount.toFixed(2));
		})
		.join('');

	// Inject the class sections and formatted date into the main template
	const templateData = {
		formattedDate,
		classSections: classSectionsHtml,
		revenue: totalRevenue.toFixed(2)
	};

	return generateHtmlTemplate('paymentSummary', templateData);
}

export async function previewEmailHtml(date: Date) {
	const emailHtml = await generatePaymentEmail(date);
	// Write the HTML to a file
	writeFileSync('preview.html', emailHtml);
}
export const sendPaymentSummaryEmail = async (email: string, date: Date) => {
	try {
		const emailHtml = await generatePaymentEmail(date);
		await sendEmail({
			to: email,
			subject: 'Payment Summary',
			html: emailHtml
		});
	} catch (error) {
		logger.error('Error sending email:', error);
		throw new Error(`Error sending email: ${error}`);
	}
};
// sendPaymentSummaryEmail('a.ateeb@proton.me', new Date());
