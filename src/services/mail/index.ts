/* eslint-disable no-console */
import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import { MailtrapTransport } from 'mailtrap';
import { MailtrapMailOptions } from 'mailtrap/dist/types/transport';
import Nodemailer from 'nodemailer';
// Replace with the actual Mailtrap client import
import templates from './mailTemplates';

const logger = new Logger('Mailtrap');

export const client = Nodemailer.createTransport(
	MailtrapTransport({
		token: config.mail.token
	}),
	{
		debug: true,
		logger: true
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
			name: 'HPS Admin Support Team'
		},
		subject: props.subject,
		html: htmlTemplate
	};

	try {
		const result = await client.sendMail(request);
		logger.debug(JSON.stringify(result));
		return result;
	} catch (error) {
		logger.error('Error sending email:', error);
		throw error; // This will now properly propagate to the transaction
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
