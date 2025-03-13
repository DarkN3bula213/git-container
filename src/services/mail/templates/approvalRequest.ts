const REQUEST_APPROVAL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Approval Notification</title>
  <style>
    .status-badge {
      background-color: #FF9800;
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
      margin: 5px 5px 5px 0;
    }
    .reject-button {
      background-color: #F44336;
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
    .request-box {
      background-color: #f9f9f9;
      border-left: 4px solid #FF9800;
      padding: 15px;
      margin: 10px 0;
    }
  </style>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
    <h1 style="color: white; margin: 0;">Request Awaiting Approval</h1>
  </div>

  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Dear {chairpersonName},</p>

    <p>A new request has been submitted by <strong>{requesterName}</strong> that requires your approval.</p>

    <h2 style="color: #FF9800; border-bottom: 2px solid #FF9800; padding-bottom: 5px;">Request Details</h2>

    <table class="details-table">
      <tr>
        <td>Request Type:</td>
        <td>{requestType}</td>
      </tr>
      <tr>
        <td>Submitted By:</td>
        <td>{requesterName} ({requesterPosition})</td>
      </tr>
      <tr>
        <td>Submission Date:</td>
        <td>{submissionDate}</td>
      </tr>
      <tr>
        <td>Department:</td>
        <td>{department}</td>
      </tr>
      <tr>
        <td>Status:</td>
        <td><span class="status-badge">Pending Approval</span></td>
      </tr>
    </table>

    <div class="request-box">
      <h3 style="margin-top: 0;">Request Description</h3>
      <p>{requestDescription}</p>
      
      {additionalDetails}
    </div>

    <h2 style="color: #FF9800; border-bottom: 2px solid #FF9800; padding-bottom: 5px;">Action Required</h2>
    
    <p>Please review this request and take one of the following actions:</p>
    
    <div style="margin: 20px 0;">
      <a href="{approveUrl}" class="action-button">Approve Request</a>
      <a href="{rejectUrl}" class="reject-button">Reject Request</a>
    </div>
    
    <p>You can also log in to the school administration portal to view more details or add comments:</p>
    <a href="{portalUrl}" class="action-button">View in Admin Portal</a>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p>Best regards,<br>
      HPS Administration System</p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated notification. Please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const approvalRequest = {
	requestApprovalTemplate: REQUEST_APPROVAL_TEMPLATE
};
