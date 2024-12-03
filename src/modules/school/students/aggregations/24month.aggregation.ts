import { eachMonthOfInterval, format, startOfMonth, subMonths } from 'date-fns';
import mongoose, { PipelineStage } from 'mongoose';
import { Student } from '../student.interface';
import StudentModel from '../student.model';

interface AggregationParams {
	classId?: string;
	section?: string;
	historyMonths?: number;
}

interface StudentWithPaymentHistory extends Student {
	history: Array<{ [key: string]: boolean }>;
}

export const getStudentsWithPaymentHistory = async ({
	classId,
	section,
	historyMonths = 24
}: AggregationParams = {}): Promise<StudentWithPaymentHistory[]> => {
	// Generate consistent months array using date-fns
	const currentDate = startOfMonth(new Date());
	const monthKeys = eachMonthOfInterval({
		start: subMonths(currentDate, historyMonths - 1),
		end: currentDate
	}).map((date) => format(date, 'MMyy'));

	const pipeline: PipelineStage[] = [
		// Initial match
		{
			$match: {
				...(classId && {
					classId: new mongoose.Types.ObjectId(classId)
				}),
				...(section && { section })
			}
		},

		// Lookup payments
		{
			$lookup: {
				from: 'payments',
				let: { studentId: '$_id' },
				pipeline: [
					{
						$match: {
							$expr: { $eq: ['$studentId', '$$studentId'] }
						}
					},
					{
						$group: {
							_id: '$payId',
							hasPaid: { $first: true }
						}
					}
				],
				as: 'payments'
			}
		},

		// Create history array with consistent months
		{
			$addFields: {
				history: {
					$map: {
						input: monthKeys,
						as: 'monthKey',
						in: {
							$arrayToObject: [
								[
									{
										k: '$$monthKey',
										v: {
											$cond: {
												if: {
													$in: [
														'$$monthKey',
														'$payments._id'
													]
												},
												then: true,
												else: false
											}
										}
									}
								]
							]
						}
					}
				}
			}
		},

		// Remove temporary payments array
		{
			$unset: ['payments']
		}
	];

	return StudentModel.aggregate<StudentWithPaymentHistory>(pipeline);
};
