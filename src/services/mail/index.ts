import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import { MailtrapTransport } from 'mailtrap';
import { MailtrapMailOptions } from 'mailtrap/dist/types/transport';
import Nodemailer from 'nodemailer';
// Replace with the actual Mailtrap client import
import templates from './mailTemplates';

const logger = new Logger('Mailtrap');
logger.debug({
	message: 'Initializing Mailtrap with token:',
	token: config.mail.token ? 'Token exists' : 'No token found'
});

export const client = Nodemailer.createTransport(
	MailtrapTransport({
		token: config.mail.token
	}),
	{
		debug: true
	}
);

client.verify(function (error, _success) {
	if (error) {
		console.error(error, {
			config: {
				token: config.mail.token ? 'exists' : 'missing',
				address: config.mail.address
			}
		});
		logger.error('Mailtrap verification failed:', {
			error: error,
			config: {
				token: config.mail.token ? 'exists' : 'missing',
				address: config.mail.address
			}
		});
	} else {
		logger.info('Mailtrap server is ready to take our messages');
	}
});
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
}

interface SendEmailWithHtml {
	to: string;
	subject: string;
	html: string; // Required when sending complete HTML
	name?: string;
	message?: string;
}

type SendEmailProps = SendEmailWithTemplate | SendEmailWithHtml;

const sendEmail = async (props: SendEmailProps) => {
	let htmlTemplate: string;

	if ('html' in props) {
		// If `html` is provided, use it directly
		htmlTemplate = props.html;
	} else {
		// If `templateName` and `templateData` are provided, use the template system
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
			name: 'HPS Admin Support Team'
		},
		subject: props.subject,
		html: htmlTemplate // Use either pre-generated or dynamically generated HTML
	};

	try {
		logger.debug({
			event: 'sendEmail',
			from: request.from,
			to: request.to,
			subject: request.subject
		});
		// Use send() instead of sendMail()
		logger.debug('Mailtrap Configuration:', {
			tokenLength: config.mail.token?.length,
			mailHost: config.mail.host,
			senderEmail: config.mail.address,
			isConfigured: !!config.mail.token && !!config.mail.address
		});
		await client.sendMail(request);
		logger.info('Email sent successfully');
	} catch (error) {
		console.log(JSON.stringify(error, null, 2), { request });
		logger.error('Error sending email:', error);
		throw error;
	}
};

export const generateHtmlTemplate = (
	templateName: keyof typeof templates,
	templateData?: Record<string, string>
): string => {
	let template = templates[templateName];
	for (const key in templateData) {
		const value = templateData[key];
		template = template.replace(new RegExp(`{${key}}`, 'g'), value);
	}
	return template;
};

export default sendEmail;
