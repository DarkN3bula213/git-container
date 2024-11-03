import IPayment from '@/modules/school/payments/payment.model';
import { endOfDay, startOfDay } from 'date-fns';

export interface PaymentAggregation {
	className: string;
	section: string;
	students: {
		studentName: string;
		payId: string;
		amount: number;
	}[];
	totalAmount: number;
}

export async function getPaymentsForDate(
	date: Date
): Promise<PaymentAggregation[]> {
	const dayStart = startOfDay(date);
	const dayEnd = endOfDay(date);

	const payments = await IPayment.aggregate([
		{
			$match: {
				paymentDate: {
					$gte: dayStart,
					$lte: dayEnd
				},
				paymentStatus: 'success'
			}
		},
		{
			$lookup: {
				from: 'students',
				localField: 'studentId',
				foreignField: '_id',
				as: 'studentDetails'
			}
		},
		{
			$unwind: '$studentDetails'
		},
		// Add a $group stage to eliminate duplicates at student level first
		{
			$group: {
				_id: {
					className: '$className',
					section: '$section',
					studentId: '$studentId' // Group by studentId to eliminate duplicates
				},
				studentName: { $first: '$studentDetails.name' },
				payId: { $first: '$studentDetails.registration_no' },
				amount: { $sum: '$amount' } // Sum amounts for the same student
			}
		},
		// Then group by class and section
		{
			$group: {
				_id: {
					className: '$_id.className',
					section: '$_id.section'
				},
				students: {
					$push: {
						studentName: '$studentName',
						payId: '$payId',
						amount: '$amount'
					}
				},
				totalAmount: { $sum: '$amount' }
			}
		},
		{
			$project: {
				_id: 0,
				className: '$_id.className',
				section: '$_id.section',
				students: 1,
				totalAmount: 1
			}
		},
		{
			$sort: { className: 1, section: 1 }
		}
	]);

	return payments;
}
