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
		token: config.mail.test.token,
		testInboxId: Number(config.mail.test.inboxId)
	}),
	{
		debug: true,
		logger: true,
		secure: config.production,
		requireTLS: config.production
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
		html: htmlTemplate,
		sandbox: !config.production
	};

	try {
		const result = await client.sendMail(request);
		logger.debug({ result });
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
