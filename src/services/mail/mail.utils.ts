import { writeFileSync } from 'fs';
import path from 'path';
import { generateHtmlTemplate } from '.';

// import { EmailTemplate } from './mailTemplates';

// Define template types
type PaymentTemplateData = {
	formattedDate: string;
	classSections: string;
	revenue: string;
};

type DeploymentTemplateData = {
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
};

type VerificationLinkTemplateData = {
	verificationCode: string;
	baseUrl: string;
};

// Map template names to their data types
type TemplateDataMap = {
	paymentSummary: PaymentTemplateData;
	deploymentSuccess: DeploymentTemplateData;
	verifyEmail: VerificationLinkTemplateData;
};

/**
 * Generates and saves an email template preview to HTML file
 * @param templateName - Name of the template to preview
 * @param data - Template-specific data
 * @param outputPath - Optional custom output path
 * @returns Path to the generated preview file
 */
export function previewEmailTemplate<T extends keyof TemplateDataMap>(
	templateName: T,
	data: TemplateDataMap[T],
	outputPath?: string
): string {
	try {
		const html = generateHtmlTemplate(templateName, data);
		const fileName =
			outputPath ??
			path.join(
				process.cwd(),
				`preview-${templateName}-${Date.now()}.html`
			);

		writeFileSync(fileName, html);
		return fileName;
	} catch (error) {
		throw new Error(
			`Failed to generate preview for template ${templateName}: ${error}`
		);
	}
}

// previewEmailTemplate('deploymentSuccess', {
// 	adminName: 'Admin',
// 	appName: 'HPS Backend',
// 	deploymentTime: new Date().toISOString(),
// 	environment: 'Production',
// 	serverRegion: 'us-east-1',
// 	dashboardUrl: config.origin ?? 'https://hps-backend.com',
// 	logsUrl: 'https://github.com/DarkN3bula213/git-container',
// 	supportEmail: config.mail.address,
// 	senderName: 'Deployment Team',
// 	senderRole: 'DevOps',
// 	companyName: 'HPS',
// 	serviceName: 'Automated Deployment Service'
// })
