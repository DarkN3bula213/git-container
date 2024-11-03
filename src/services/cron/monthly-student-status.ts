import IPayment from '@/modules/school/payments/payment.model';
import StudentModel from '@/modules/school/students/student.model';
import { endOfMonth, startOfMonth } from 'date-fns';

interface StudentFeeStatus {
	studentName: string;
	registrationNo: string;
	hasPaid: boolean;
	amount?: number;
	paidDate?: Date;
	invoiceId?: string;
}

interface SectionSummary {
	section: string;
	students: StudentFeeStatus[];
	paidCount: number;
	totalCount: number;
	collectedAmount: number;
}

interface ClassSummary {
	className: string;
	sections: SectionSummary[];
	totalStudents: number;
	paidStudents: number;
	collectedAmount: number;
}

interface GlobalSummary {
	totalStudents: number;
	paidStudents: number;
	totalCollection: number;
}

export async function getMonthlyFeeStatus(date: Date) {
	const monthStart = startOfMonth(date);
	const monthEnd = endOfMonth(date);

	// First get all students grouped by class and section
	const allStudents = await StudentModel.aggregate([
		{
			$group: {
				_id: {
					className: '$className',
					section: '$section'
				},
				students: {
					$push: {
						_id: '$_id',
						name: '$name',
						registrationNo: '$registration_no'
					}
				},
				totalCount: { $sum: 1 }
			}
		},
		{
			$group: {
				_id: '$_id.className',
				sections: {
					$push: {
						section: '$_id.section',
						students: '$students',
						totalCount: '$totalCount'
					}
				},
				totalStudents: { $sum: '$totalCount' }
			}
		}
	]);

	// Get all payments for the month
	const payments = await IPayment.aggregate([
		{
			$match: {
				paymentDate: {
					$gte: monthStart,
					$lte: monthEnd
				},
				paymentStatus: 'success'
			}
		},
		{
			$group: {
				_id: {
					className: '$className',
					section: '$section',
					studentId: '$studentId'
				},
				studentName: { $first: '$studentName' },
				amount: { $sum: '$amount' },
				paidDate: { $first: '$paymentDate' },
				invoiceId: { $first: '$invoiceId' }
			}
		},
		{
			$group: {
				_id: {
					className: '$_id.className',
					section: '$_id.section'
				},
				paidStudents: {
					$push: {
						studentId: '$_id.studentId',
						studentName: '$studentName',
						amount: '$amount',
						paidDate: '$paidDate',
						invoiceId: '$invoiceId'
					}
				},
				paidCount: { $sum: 1 },
				collectedAmount: { $sum: '$amount' }
			}
		}
	]);

	// Create a map of payments for easy lookup
	const paymentMap = new Map(
		payments.map((p) => [
			`${p._id.className}-${p._id.section}`,
			{
				paidStudents: new Map(
					p.paidStudents.map((s: any) => [s.studentId.toString(), s])
				),
				paidCount: p.paidCount,
				collectedAmount: p.collectedAmount
			}
		])
	);

	// Combine the data
	const classSummaries: ClassSummary[] = allStudents.map((classData) => {
		const sections: SectionSummary[] = classData.sections.map(
			(section: { section: any; students: any[]; totalCount: any }) => {
				const paymentInfo = paymentMap.get(
					`${classData._id}-${section.section}`
				) || {
					paidStudents: new Map(),
					paidCount: 0,
					collectedAmount: 0
				};

				const students: StudentFeeStatus[] = section.students
					.map((student) => {
						const payment = paymentInfo.paidStudents.get(
							student._id.toString()
						);
						return {
							studentName: student.name,
							registrationNo: student.registrationNo,
							hasPaid: !!payment,
							amount: payment?.amount,
							paidDate: payment?.paidDate,
							invoiceId: payment?.invoiceId
						};
					})
					.sort((a, b) => a.studentName.localeCompare(b.studentName));

				return {
					section: section.section,
					students,
					paidCount: paymentInfo.paidCount,
					totalCount: section.totalCount,
					collectedAmount: paymentInfo.collectedAmount
				};
			}
		);

		const classTotals = sections.reduce(
			(acc, section) => ({
				paidStudents: acc.paidStudents + section.paidCount,
				collectedAmount: acc.collectedAmount + section.collectedAmount
			}),
			{ paidStudents: 0, collectedAmount: 0 }
		);

		return {
			className: classData._id,
			sections: sections.sort((a, b) =>
				a.section.localeCompare(b.section)
			),
			totalStudents: classData.totalStudents,
			paidStudents: classTotals.paidStudents,
			collectedAmount: classTotals.collectedAmount
		};
	});

	// Calculate global summary
	const globalSummary: GlobalSummary = classSummaries.reduce(
		(acc, cls) => ({
			totalStudents: acc.totalStudents + cls.totalStudents,
			paidStudents: acc.paidStudents + cls.paidStudents,
			totalCollection: acc.totalCollection + cls.collectedAmount
		}),
		{ totalStudents: 0, paidStudents: 0, totalCollection: 0 }
	);

	return {
		date: date.toISOString(),
		summary: globalSummary,
		collectionRate: globalSummary.totalStudents
			? (
					(globalSummary.paidStudents / globalSummary.totalStudents) *
					100
				).toFixed(1) + '%'
			: '0%',
		classes: classSummaries.sort((a, b) =>
			a.className.localeCompare(b.className)
		)
	};
} // Email templates with improved styling and structure
const MONTHLY_FEE_STATUS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Fee Status Report - {monthYear}</title>
    <style>
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
        th { background-color: #f4f4f4; }
        .paid { color: #2e7d32; font-weight: bold; }
        .unpaid { color: #c62828; font-weight: bold; }
        .summary { font-weight: bold; margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .class-summary { background: #e8f5e9; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .section-summary { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .total-row { background-color: #f4f4f4; font-weight: bold; }
    </style>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center; border-radius: 5px;">
        <h1 style="color: white; margin: 0;">Monthly Fee Status Report</h1>
        <h2 style="color: white; margin: 10px 0 0 0;">{monthYear}</h2>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <div class="summary">
            <h3 style="margin-top: 0;">Global Summary</h3>
            <p>Total Students: {totalStudents}</p>
            <p>Paid Students: {paidStudents}</p>
            <p>Total Collection: Rs. {totalCollection}/-</p>
            <p>Overall Collection Rate: {overallRate}%</p>
        </div>
        {classesHtml}
    </div>
</body>
</html>
`;

const CLASS_SUMMARY_TEMPLATE = `
<div style="margin-bottom: 30px;">
    <div class="class-summary">
        <h3 style="margin-top: 0;">Class: {className}</h3>
        <p>Total Students: {totalStudents} | Paid Students: {paidStudents} | Collection: Rs. {collectedAmount}/- | Rate: {collectionRate}%</p>
    </div>
    {sectionsHtml}
</div>
`;

const SECTION_STATUS_TEMPLATE = `
<div style="margin-bottom: 20px;">
    <div class="section-summary">
        <h4 style="margin-top: 0;">Section: {section}</h4>
        <p>Collection Rate: {collectionRate}% ({paidCount}/{totalCount} students) | Amount: Rs. {collectedAmount}/-</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Registration No</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Invoice ID</th>
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
    <td>{index}</td>
    <td>{studentName}</td>
    <td>{registrationNo}</td>
    <td class="{statusClass}">{status}</td>
    <td style="text-align: right">{amount}</td>
    <td>{invoiceId}</td>
    <td>{paidDate}</td>
</tr>
`;

export async function generateMonthlyFeeStatusEmail(
	date: Date
): Promise<string> {
	const feeStatus = await getMonthlyFeeStatus(date);
	const monthYear = date.toLocaleString('default', {
		month: 'long',
		year: 'numeric'
	});

	// Generate HTML for each class
	const classesHtml = feeStatus.classes
		.map((classData) => {
			// Generate HTML for each section in the class
			const sectionsHtml = classData.sections
				.map((section) => {
					const studentRowsHtml = section.students
						.map((student, index) =>
							STUDENT_STATUS_ROW_TEMPLATE.replace(
								'{index}',
								(index + 1).toString()
							)
								.replace('{studentName}', student.studentName)
								.replace(
									'{registrationNo}',
									student.registrationNo
								)
								.replace(
									'{statusClass}',
									student.hasPaid ? 'paid' : 'unpaid'
								)
								.replace(
									'{status}',
									student.hasPaid ? 'PAID' : 'UNPAID'
								)
								.replace(
									'{amount}',
									student.hasPaid
										? `Rs. ${student.amount!.toLocaleString()}/-`
										: '-'
								)
								.replace(
									'{invoiceId}',
									student.hasPaid
										? student.invoiceId || '-'
										: '-'
								)
								.replace(
									'{paidDate}',
									student.hasPaid
										? new Date(
												student.paidDate!
											).toLocaleDateString('en-US', {
												day: '2-digit',
												month: 'short',
												year: 'numeric'
											})
										: '-'
								)
						)
						.join('');

					const collectionRate = section.totalCount
						? (
								(section.paidCount / section.totalCount) *
								100
							).toFixed(1)
						: '0.0';

					return SECTION_STATUS_TEMPLATE.replace(
						'{section}',
						section.section
					)
						.replace('{collectionRate}', collectionRate)
						.replace('{paidCount}', section.paidCount.toString())
						.replace('{totalCount}', section.totalCount.toString())
						.replace(
							'{collectedAmount}',
							section.collectedAmount.toLocaleString()
						)
						.replace('{studentRows}', studentRowsHtml);
				})
				.join('');

			const classCollectionRate = classData.totalStudents
				? (
						(classData.paidStudents / classData.totalStudents) *
						100
					).toFixed(1)
				: '0.0';

			return CLASS_SUMMARY_TEMPLATE.replace(
				'{className}',
				classData.className
			)
				.replace('{totalStudents}', classData.totalStudents.toString())
				.replace('{paidStudents}', classData.paidStudents.toString())
				.replace(
					'{collectedAmount}',
					classData.collectedAmount.toLocaleString()
				)
				.replace('{collectionRate}', classCollectionRate)
				.replace('{sectionsHtml}', sectionsHtml);
		})
		.join('');

	// Generate the final email HTML
	return MONTHLY_FEE_STATUS_TEMPLATE.replace('{monthYear}', monthYear)
		.replace('{totalStudents}', feeStatus.summary.totalStudents.toString())
		.replace('{paidStudents}', feeStatus.summary.paidStudents.toString())
		.replace(
			'{totalCollection}',
			feeStatus.summary.totalCollection.toLocaleString()
		)
		.replace('{overallRate}', feeStatus.collectionRate.replace('%', ''))
		.replace('{classesHtml}', classesHtml);
}
