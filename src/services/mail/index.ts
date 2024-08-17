import { MailtrapTransport } from 'mailtrap'; // Replace with the actual Mailtrap client import
import templates from './mailTemplates';
import Nodemailer from 'nodemailer';
import { config } from '@/lib/config';
import { MailtrapMailOptions } from 'mailtrap/dist/types/transport';
import { Logger } from '@/lib/logger';
const logger = new Logger('Mailtrap');

export const client = Nodemailer.createTransport(
  MailtrapTransport({
    token: config.mail.token,
  }),
);

interface SendEmailProps {
  to: string;
  subject: string;
  templateName: keyof typeof templates;
  templateData?: Record<string, string>;
  name?: string;
  message?: string;
}

const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
  name,
  message,
}: SendEmailProps) => {
  const htmlTemplate = generateHtmlTemplate(templateName, templateData);

  const request: MailtrapMailOptions = {
    text: message ?? '',

    to: {
      address: to,
      name: name ?? '',
    },
    from: {
      address: config.mail.address,
      name: 'Application Support',
    },
    subject: subject,
    html: htmlTemplate,
  };

  try {
    const response = await client.sendMail(request);

    logger.info('Email sent successfully', response);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new Error(`Error sending email: ${error}`);
  }
};

const generateHtmlTemplate = (
  templateName: keyof typeof templates,
  templateData?: Record<string, string>,
): string => {
  let template = templates[templateName];
  for (const key in templateData) {
    const value = templateData[key];
    template = template.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return template;
};

export default sendEmail;

interface SendEmailProps {
  to: string;
  subject: string;
  templateName: keyof typeof templates;
  templateData?: Record<string, string>;
  name?: string;
  message?: string;
}

class EmailTemplateService {
  constructor(private templates: Record<string, string>) {}

  generateHtmlTemplate(
    templateName: keyof typeof templates,
    templateData?: Record<string, string>,
  ): string {
    let template = this.templates[templateName];

    if (templateData) {
      for (const key in templateData) {
        const value = templateData[key];
        template = template.replace(new RegExp(`{${key}}`, 'g'), value);
      }
    }

    return template;
  }
}

class EmailService {
  constructor(
    private templateService: EmailTemplateService,
    private mailClient: typeof client,
  ) {}

  async sendEmail({
    to,
    subject,
    templateName,
    templateData,
    name,
    message,
  }: SendEmailProps) {
    const htmlTemplate = this.templateService.generateHtmlTemplate(
      templateName,
      templateData,
    );

    const request: MailtrapMailOptions = {
      text: message ?? '',
      to: { address: to, name: name ?? '' },
      from: { address: config.mail.address, name: 'Application Support' },
      subject: subject,
      html: htmlTemplate,
    };

    try {
      const response = await this.mailClient.sendMail(request);
      logger.info('Email sent successfully', response);
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error(`Error sending email: ${error}`);
    }
  }
}
