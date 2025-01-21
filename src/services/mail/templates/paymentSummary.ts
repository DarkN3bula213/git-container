const paymentSummaryTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Summary for {formattedDate}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #3c8f40fc); padding: 20px; text-align: center; border-radius: 5px 5px 0 0; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
    <h1 style="color: white; margin: 0; font-size: 18px;">Payment Summary for {formattedDate}</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
     <p style="font-size: 14px">Total revenue generated: Rs {revenue} /- </p>
    <p style="font-size: 14px">Here is the payment summary for the class and sections:</p>
    <hr />
    {classSections}
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
const CLASS_SECTION_TEMPLATE = `
<div style="margin-bottom: 20px;">
  <h4 style="text-align: center; margin-bottom: 10px;">{className} - <span style="font-size: 14px;">{section}</span></h4>
  <table style="width: 100%; border-collapse: collapse; border-radius: 5px;">
    <thead>
      <tr>
        <th style="border: 1px solid #ddd; padding: 8px; font-size: 14px; text-align: left; font-weight: 600;">Name</th>
        <th style="border: 1px solid #ddd; padding: 8px; font-size: 14px; text-align: left; font-weight: 600;">Reg No</th>
        <th style="border: 1px solid #ddd; padding: 8px; font-size: 14px; text-align: left; font-weight: 600;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {studentRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="1" style="padding: 8px; text-align: left; font-size: 12px; border: 1px solid #ddd; background-color: #c2c2c2;"></td>
        <td style="padding: 8px; text-align: left; font-size: 12px; border: 1px solid #ddd;"><strong>Total:</strong></td>
        <td style="padding: 8px; text-align: left; font-size: 12px; border: 1px solid #ddd;">{totalAmount}</td>
      </tr>
    </tfoot>
  </table>
  <hr />
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

const STUDENT_ROW_TEMPLATE = `
<tr>
  <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">{studentName}</td>
  <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">{payId}</td>
  <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">{amount}</td>
</tr>
`;
export const paymentSummary = {
	paymentSummaryTemplate,
	classSectionTemplate: CLASS_SECTION_TEMPLATE,
	studentStatusRowTemplate: STUDENT_STATUS_ROW_TEMPLATE,
	studentRowTemplate: STUDENT_ROW_TEMPLATE
};
