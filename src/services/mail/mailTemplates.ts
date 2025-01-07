const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Verify Your Email</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>Thank you for signing up! Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">{verificationCode}</span>
    </div>
    <p>Enter this code on the verification page to complete your registration.</p>
    <p>This code will expire in 15 minutes for security reasons.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
    <p>Best regards,<br>HPS Admin Support Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

const REISSUE_VERIFICATION_TOKEN_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reissue Verification Token</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Reissue Verification Token</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello {username},</p>
    <p>A new verification token has been generated for your account. Your new verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">{verificationCode}</span>
    </div>
    <p>Enter this code on the at the verification prompt to complete the verification process.</p>
    <p>This code will expire in 15 minutes for security reasons.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
    <p>Best regards,<br>HPS Admin Support Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
`;

const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset Successful</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We're writing to confirm that your password has been successfully reset.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #4CAF50; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; display: inline-block; font-size: 30px;">
        ✓
      </div>
    </div>
    <p>If you did not initiate this password reset, please contact our support team immediately.</p>
    <p>For security reasons, we recommend that you:</p>
    <ul>
      <li>Use a strong, unique password</li>
      <li>Enable two-factor authentication if available</li>
      <li>Avoid using the same password across multiple sites</li>
    </ul>
    <p>Thank you for helping us keep your account secure.</p>
    <p>Best regards,<br>HPS Admin Support Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
    <p>To reset your password, click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{resetURL}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>Best regards,<br>HPS Admin Support Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
const SUCCESSFUL_VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified Successfully</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Email Verified Successfully</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We are happy to inform you that your email address has been successfully verified.</p>
    <p>Thank you for confirming your email. You can now fully enjoy all the features our platform offers.</p>
    <p>If you have any questions or need support, feel free to reach out to our support team.</p>
    <p>Best regards,<br>HPS Admin Support Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
const DAILY_PAYMENT_REPORT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Payment Report</title>
  <style>
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; border: 1px solid #ddd; }
    th { background-color: #f4f4f4; }
  </style>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Daily Payment Report</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Date: {date}</p>
    <p>Number of payments: {paymentCount}</p>
    <table>
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Registration Number</th>
          <th>Class</th>
          <th>Section</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows}
        <tr>
          <td colspan="4" style="text-align: right; font-weight: bold;">Total Amount:</td>
          <td style="font-weight: bold;">{totalAmount}</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
`;
const PAYMENT_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Summary for {formattedDate}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #3c8f40); padding: 20px; text-align: center; border-radius: 5px;">
    <h1 style="color: white; margin: 0;">Payment Summary for {formattedDate}</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
     <p>Total revenue generated: Rs {revenue} /- </p>
    <p>Here is the payment summary for the class and sections:</p>
    {classSections}
    <p>Best regards,<br>Hafeez Public School - Application Support Team </p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

const CLASS_SECTION_TEMPLATE = `
<div style="margin-bottom: 20px;">
  <h3>Class: {className} - Section: {section}</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr>
        <th style="border: 1px solid #ddd; padding: 8px;">Student Name</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Pay ID</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {studentRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding: 8px; text-align: right;"><strong>Total:</strong></td>
        <td style="padding: 8px; text-align: right;">{totalAmount}</td>
      </tr>
    </tfoot>
  </table>
</div>
`;

const STUDENT_ROW_TEMPLATE = `
<tr>
  <td style="border: 1px solid #ddd; padding: 8px;">{studentName}</td>
  <td style="border: 1px solid #ddd; padding: 8px;">{payId}</td>
  <td style="border: 1px solid #ddd; padding: 8px;">{amount}</td>
</tr>
`;

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

const DEPLOYMENT_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deployment Success Notification</title>
  <style>
    .status-badge {
      background-color: #4CAF50;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      display: inline-block;
    }
    .action-button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      display: inline-block;
      margin: 5px 0;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .details-table td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    .details-table td:first-child {
      font-weight: bold;
      width: 40%;
    }
    .step-box {
      background-color: #f9f9f9;
      border-left: 4px solid #4CAF50;
      padding: 15px;
      margin: 10px 0;
    }
  </style>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Deployment Success!</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Dear {adminName},</p>
    
    <p>We're excited to inform you that your application <strong>{appName}</strong> has been successfully deployed through our automated service.</p>
    
    <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Deployment Summary</h2>
    
    <table class="details-table">
      <tr>
        <td>Application Name:</td>
        <td>{appName}</td>
      </tr>
      <tr>
        <td>Deployment Time:</td>
        <td>{deploymentTime}</td>
      </tr>
      <tr>
        <td>Environment:</td>
        <td>{environment}</td>
      </tr>
      <tr>
        <td>Server/Region:</td>
        <td>{serverRegion}</td>
      </tr>
      <tr>
        <td>Status:</td>
        <td><span class="status-badge">Successful</span></td>
      </tr>
    </table>

    <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Next Steps</h2>
    
    <div class="step-box">
      <h3 style="margin-top: 0;">1. Verify Application Status</h3>
      <p>Use our monitoring dashboard to ensure the application is functioning as expected.</p>
      <a href="{dashboardUrl}" class="action-button">Go to Monitoring Dashboard</a>
    </div>

    <div class="step-box">
      <h3 style="margin-top: 0;">2. Review Logs</h3>
      <p>Review the deployment logs to ensure all automated steps were executed correctly.</p>
      <a href="{logsUrl}" class="action-button">View Deployment Logs</a>
    </div>

    <div class="step-box">
      <h3 style="margin-top: 0;">3. Test the Application</h3>
      <p>Perform a quick manual test to verify that all critical services are operational.</p>
    </div>

    <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Need Assistance?</h2>
    <p>If you encounter any issues or have questions, please don't hesitate to contact our support team:</p>
    <a href="mailto:{supportEmail}" class="action-button">Contact Support</a>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p>Best regards,<br>
      {senderName}<br>
      {senderRole}<br>
      {companyName} | {serviceName}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated deployment notification. Please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export default {
	verfifation: VERIFICATION_EMAIL_TEMPLATE,
	reissueVerificationToken: REISSUE_VERIFICATION_TOKEN_TEMPLATE,
	reset: PASSWORD_RESET_REQUEST_TEMPLATE,
	success: PASSWORD_RESET_SUCCESS_TEMPLATE,
	emailVerified: SUCCESSFUL_VERIFICATION_EMAIL_TEMPLATE,
	dailyPaymentReport: DAILY_PAYMENT_REPORT_TEMPLATE,
	paymentSummary: PAYMENT_EMAIL_TEMPLATE,
	classSection: CLASS_SECTION_TEMPLATE,
	studentRow: STUDENT_ROW_TEMPLATE,
	monthlyFee: MONTHLY_FEE_STATUS_TEMPLATE,
	classSectionStatus: CLASS_SECTION_STATUS_TEMPLATE,
	studentStatusRow: STUDENT_STATUS_ROW_TEMPLATE,
	deploymentSuccess: DEPLOYMENT_SUCCESS_TEMPLATE
};
