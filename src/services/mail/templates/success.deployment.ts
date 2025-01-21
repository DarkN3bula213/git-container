export const deploymentSuccess = `
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
