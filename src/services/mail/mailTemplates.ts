import { approvalRequest } from './templates/approvalRequest';
import { paymentSummary } from './templates/paymentSummary';
import { reIssueTokenTemplate } from './templates/reissueToken';
import { resetPasswordTemplate } from './templates/resetPassword';
import { deploymentSuccess } from './templates/success.deployment';
import { emailverificationTemplateSuccess } from './templates/success.emailVerification';
import { passwordResetSuccess } from './templates/success.resetPassword';
import { verificationLinkTemplate } from './templates/verificationLink';
import { verifyEmail } from './templates/verifyEmail';

// Monthly Fee Status Email Template
const MONTHLY_FEE_STATUS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Fee Status Report - {monthYear}</title>
    <style>
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px; border: 1px solid #ddd; }
        th { background-color: #f4f4f4; }
        .paid { color: green; }
        .unpaid { color: red; }
        .summary { font-weight: bold; margin-bottom: 10px; }
    </style>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Monthly Fee Status Report</h1>
        <h2 style="color: white; margin: 10px 0 0 0;">{monthYear}</h2>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <div class="summary">
            <p>Total Collection: Rs. {totalCollection}/-</p>
            <p>Overall Collection Rate: {overallRate}%</p>
        </div>
        {classSections}
    </div>
</body>
</html>
`;

const CLASS_SECTION_STATUS_TEMPLATE = `
<div style="margin-bottom: 30px;">
    <h3>Class: {className} - Section: {section}</h3>
    <p>Collection Rate: {collectionRate}% ({paidCount}/{totalCount} students)</p>
    <table>
        <thead>
            <tr>
                <th>Student Name</th>
                <th>Registration No</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Payment Date</th>
            </tr>
        </thead>
        <tbody>
            {studentRows}
        </tbody>
    </table>
</div>
`;

const STUDENT_STATUS_ROW_TEMPLATE = `
<tr>
    <td>{studentName}</td>
    <td>{registrationNo}</td>
    <td class="{statusClass}">{status}</td>
    <td>{amount}</td>
    <td>{paidDate}</td>
</tr>
`;

const templates = {
	verifyEmail: verifyEmail,
	reissueVerificationToken: reIssueTokenTemplate,
	resetPassword: resetPasswordTemplate,
	resetPasswordSuccess: passwordResetSuccess,
	emailVerificationSuccess: emailverificationTemplateSuccess,
	paymentSummary: paymentSummary.paymentSummaryTemplate,
	classSection: paymentSummary.classSectionTemplate,
	studentRow: paymentSummary.studentRowTemplate,
	// dailyPaymentReport: DAILY_PAYMENT_REPORT_TEMPLATE,
	monthlyFee: MONTHLY_FEE_STATUS_TEMPLATE,
	classSectionStatus: CLASS_SECTION_STATUS_TEMPLATE,
	studentStatusRow: STUDENT_STATUS_ROW_TEMPLATE,
	deploymentSuccess: deploymentSuccess,
	verificationLink: verificationLinkTemplate,
	approvalRequest: approvalRequest.requestApprovalTemplate
} as const;

export default templates;
export type EmailTemplate = keyof typeof templates;
