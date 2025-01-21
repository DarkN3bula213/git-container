import { BadRequestError } from '@/lib/api';
import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import { numberFormatter } from '@/lib/utils/numberFormatter';
import dayjs from 'dayjs';
import { writeFileSync } from 'fs';
import sendEmail, { generateHtmlTemplate } from '.';
import { getPaymentsForDate } from '../cron/daily-fees';
// import { previewEmailTemplate } from './mail.utils';
import template, { EmailTemplate } from './mailTemplates';

const logger = new Logger(__filename);

export const sendWelcomeEmail = async (email: string, name: string) => {
	try {
		await sendEmail({
			to: email,
			subject: 'Welcome to HPS Admin',
			templateName: 'verifyEmail' as EmailTemplate,
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
			templateName: 'verifyEmail',
			templateData: { verificationCode: token },
			name: name
		});
		logger.debug({ emailRes });
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
			templateName: 'resetPassword',
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
			templateName: 'resetPasswordSuccess',
			templateData: { resetURL: url }
		});
		logger.debug({
			response: emailRes
		});
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
			templateName: 'resetPasswordSuccess'
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
			templateName: 'emailVerificationSuccess'
		});
	} catch (error) {
		console.error(`Error sending password reset success email`, error);
		throw new Error(`Error sending password reset success email: ${error}`);
	}
};

// export const sendDailyReport = async () => {
// 	try {
// 		await sendEmail({
// 			to: 'info@hps.com',
// 			subject: 'Daily Report',
// 			templateName: 'dailyPaymentReport',
// 			templateData: {
// 				date: new Date().toLocaleDateString(),
// 				totalAmount: (1000).toLocaleString()
// 			}
// 		});
// 	} catch (error) {
// 		console.error(`Error sending password reset success email`, error);
// 		throw new Error(`Error sending password reset success email: ${error}`);
// 	}
// };

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
						.replace('{amount}', numberFormatter(student.amount))
				)
				.join('');

			return template.classSection
				.replace('{className}', payment.className)
				.replace('{section}', payment.section)
				.replace('{studentRows}', studentRowsHtml)
				.replace('{totalAmount}', numberFormatter(payment.totalAmount));
		})
		.join('');

	// Inject the class sections and formatted date into the main template
	const templateData = {
		formattedDate,
		classSections: classSectionsHtml,
		revenue: numberFormatter(totalRevenue)
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
			subject: config.mail.paymentSummarySubject,
			html: emailHtml
		});
	} catch (error) {
		logger.error('Error sending email:', error);
		throw new Error(`Error sending email: ${error}`);
	}
};
// sendPaymentSummaryEmail('a.ateeb@proton.me', new Date());
// previewEmailHtml(new Date());

interface DeploymentDetails {
	adminName: string;
	appName: string;
	deploymentTime: string;
	environment: string;
	serverRegion: string;
	dashboardUrl: string;
	logsUrl: string;
	supportEmail: string;
	senderName: string;
	senderRole: string;
	companyName: string;
	serviceName: string;
}

export async function generateDeploymentSuccessEmail(
	details: DeploymentDetails
): Promise<string> {
	// Format the deployment time if it's a Date object
	const formattedDeploymentTime: string = details.deploymentTime
		? details.deploymentTime.toLocaleString()
		: details.deploymentTime;

	const templateData = {
		adminName: details.adminName,
		appName: details.appName,
		deploymentTime: formattedDeploymentTime,
		environment: details.environment,
		serverRegion: details.serverRegion,
		dashboardUrl: details.dashboardUrl,
		logsUrl: details.logsUrl,
		supportEmail: details.supportEmail,
		senderName: details.senderName,
		senderRole: details.senderRole,
		companyName: details.companyName,
		serviceName: details.serviceName
	};

	return generateHtmlTemplate('deploymentSuccess', templateData);
}

export const sendDeploymentSuccessEmail = async (
	email: string,
	details: DeploymentDetails
) => {
	try {
		const emailHtml = await generateDeploymentSuccessEmail(details);
		await sendEmail({
			to: email,
			subject: 'Application Deployment Success',
			html: emailHtml
		});
	} catch (error) {
		logger.error('Error sending deployment success email:', error);
		throw new Error(`Error sending deployment success email: ${error}`);
	}
};

// Example usage:
/*
 */

export const sendOnDeployment = async () => {
	await sendDeploymentSuccessEmail('a.ateeb@proton.me', {
		adminName: 'Admin',
		appName: 'HPS Backend',
		deploymentTime: dayjs(new Date()).format('DD-MM-YYYY HH:mm:ss'),
		environment: 'Production',
		serverRegion: 'us-east-1',
		dashboardUrl: config.origin ?? 'https://hps-backend.com',
		logsUrl: 'https://github.com/DarkN3bula213/git-container',
		supportEmail: config.mail.address,
		senderName: 'Deployment Team',
		senderRole: 'DevOps Engineer',
		companyName: 'HPS',
		serviceName: 'Automated Deployment Service'
	});
};

// previewEmailTemplate('verificationLink', {
// 	verificationCode: '123456',
// 	baseUrl: 'http://localhost:5173'
// });
export const sendVerificationLinkEmail = async (
	email: string,
	token: string
) => {
	const emailHtml = generateHtmlTemplate('verificationLink', {
		verificationCode: token,
		baseUrl: config.production ? config.origin : 'http://localhost:5173'
	});
	// logger.debug({ emailHtml });
	await sendEmail({
		to: email,
		subject: 'Verification Link',
		html: emailHtml
	});
};
