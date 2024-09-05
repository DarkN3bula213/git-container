import mongoose from 'mongoose';
import IPayment from '@/modules/school/payments/payment.model';
import templates from '../mail/mailTemplates';
import sendEmail from '../mail';
interface PaymentAggregation {
  className: string;
  section: string;
  students: {
    studentName: string;
    payId: string;
    amount: number;
  }[];
  totalAmount: number;
}

async function getPaymentsForDate(date: Date): Promise<PaymentAggregation[]> {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const payments = await IPayment.aggregate([
    {
      $match: {
        paymentDate: { $gte: startOfDay, $lte: endOfDay },
        paymentStatus: 'success', // Match with the status used in the schema
      },
    },
    {
      $lookup: {
        from: 'students', // Assuming your students collection is named 'students'
        localField: 'studentId',
        foreignField: '_id',
        as: 'studentDetails',
      },
    },
    {
      $unwind: '$studentDetails',
    },
    {
      $group: {
        _id: { className: '$className', section: '$section' },
        students: {
          $push: {
            studentName: '$studentDetails.name', // Replace with the actual field name in the student schema
            payId: '$studentDetails.registration_no',
            amount: '$amount',
          },
        },
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        className: '$_id.className',
        section: '$_id.section',
        students: 1,
        totalAmount: 1,
      },
    },
    {
      $sort: { className: 1, section: 1 },
    },
  ]);

  return payments;
}
// (async () => {
//   const date = new Date(); // Use today's date or any specific date
//   const payments = await getPaymentsForDate(date);

//   console.log(JSON.stringify(payments, null, 2));
// })();
export function generateHtmlTemplateForPayments(
  payments: PaymentAggregation[],
  date: Date,
): string {
  const formattedDate = date.toLocaleDateString();
  let totalAmount = 0;

  const rows = payments
    .map((payment) => {
      const studentRows = payment.students
        .map((student) => {
          totalAmount += student.amount;
          return `<tr>
                <td>${student.studentName}</td>
                <td>${student.payId}</td>
                <td>${payment.className}</td>
                <td>${payment.section}</td>
                <td>${student.amount.toFixed(2)}</td>
              </tr>`;
        })
        .join('');

      return `
      <tr>
        <td colspan="5" style="background-color: #f2f2f2; font-weight: bold;">
          ${payment.className} - ${payment.section}
        </td>
      </tr>
      ${studentRows}
      <tr>
        <td colspan="4" style="text-align: right; font-weight: bold;">Subtotal:</td>
        <td>${payment.totalAmount.toFixed(2)}</td>
      </tr>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Payment Report - ${formattedDate}</title>
      <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; }
        th { background-color: #f4f4f4; }
      </style>
    </head>
    <body>
      <h1>Daily Payment Report</h1>
      <p>Date: ${formattedDate}</p>
      <p>Number of payments: ${payments.reduce((acc, cur) => acc + cur.students.length, 0)}</p>
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
          ${rows}
          <tr>
            <td colspan="4" style="text-align: right; font-weight: bold;">Total Amount:</td>
            <td style="font-weight: bold;">${totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>`;
}
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

// Example use case in your cron job or any scheduled task
export const sendDailyPaymentReport = async () => {
  const date = new Date();
  const payments = await getPaymentsForDate(date);

  if (payments.length === 0) {
    console.log('No payments found for today.');
    return;
  }

  let totalAmount = 0;
  const rows = payments
    .map((payment) => {
      return payment.students
        .map((student) => {
          totalAmount += student.amount;
          return `
        <tr>
          <td>${student.studentName}</td>
          <td>${student.payId}</td>
          <td>${payment.className}</td>
          <td>${payment.section}</td>
          <td>${student.amount.toFixed(2)}</td>
        </tr>`;
        })
        .join('');
    })
    .join('');

  const htmlTemplate = generateHtmlTemplate('dailyPaymentReport', {
    date: date.toLocaleDateString(),
    paymentCount: payments
      .reduce((acc, cur) => acc + cur.students.length, 0)
      .toString(),
    rows: rows,
    totalAmount: totalAmount.toFixed(2),
  });

  await sendEmail({
    to: 'a.ateeb@proton.me',
    subject: `Daily Payment Report - ${date.toLocaleDateString()}`,
    templateName: 'dailyPaymentReport',
    templateData: { report: htmlTemplate },
    name: 'Admin',
  });
};
