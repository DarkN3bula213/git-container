/* eslint-disable no-console */
import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import { MailtrapTransport } from 'mailtrap';
import { MailtrapMailOptions } from 'mailtrap/dist/types/transport';
import Nodemailer from 'nodemailer';
import templates from './mailTemplates';

const logger = new Logger('Mailtrap');

export const client = Nodemailer.createTransport(
	MailtrapTransport({
		token: config.mail.token
		// testInboxId: Number(config.mail.test.inboxId)
	}),
	{
		debug: true,
		logger: true,
		secure: config.isProduction,
		requireTLS: config.isProduction
	}
);

client.on('error', (err) => {
	console.error(err);
	logger.error('Mailtrap transport error:', err);
});

interface SendEmailWithTemplate {
	to: string;
	subject: string;
	templateName: keyof typeof templates; // Required when using template
	templateData?: Record<string, string>;
	name?: string;
	message?: string;
	title?: string;
}

interface SendEmailWithHtml {
	to: string;
	subject: string;
	html: string; // Required when sending complete HTML
	name?: string;
	message?: string;
	title?: string;
}

type SendEmailProps = SendEmailWithTemplate | SendEmailWithHtml;

interface MailError extends Error {
	code?: string;
	command?: string;
}

const sendEmail = async (props: SendEmailProps) => {
	let htmlTemplate: string;

	if ('html' in props) {
		htmlTemplate = props.html;
	} else {
		htmlTemplate = generateHtmlTemplate(
			props.templateName,
			props.templateData
		);
	}

	const request: MailtrapMailOptions = {
		text: props.message ?? '',
		to: {
			address: props.to,
			name: props.name ?? ''
		},
		from: {
			address: config.mail.address,
			name: props.title ?? 'HPS Admin Support Team'
		},
		subject: props.subject,
		html: htmlTemplate
	};

	try {
		logger.debug('Attempting to send email', {
			to: props.to,
			subject: props.subject,
			templateName:
				'templateName' in props ? props.templateName : undefined
		});

		const result = await client.sendMail(request);

		logger.debug('Email sent successfully', {
			messageId: result.messageId,
			response: result.response,
			to: props.to
		});

		return {
			success: true,
			result
		};
	} catch (error) {
		const mailError = error as MailError;

		// Log detailed error information
		logger.error({
			name: mailError.name,
			message: mailError.message,
			code: mailError.code,
			command: mailError.command,
			stack: mailError.stack,
			to: props.to,
			subject: props.subject,
			templateName:
				'templateName' in props ? props.templateName : undefined
		});

		// Return error information instead of throwing
		return {
			success: false,
			error: {
				message: mailError.message,
				code: mailError.code,
				name: mailError.name
			}
		};
	}
};

export const generateHtmlTemplate = (
	templateName: keyof typeof templates,
	templateData?: Record<string, string>
): string => {
	const template = templates[templateName];
	if (!template) {
		logger.error(`Template "${templateName}" not found`);
		return '';
	}

	return Object.entries(templateData || {}).reduce(
		(acc, [key, value]) => acc.replace(new RegExp(`{${key}}`, 'g'), value),
		template
	);
};

export default sendEmail;
