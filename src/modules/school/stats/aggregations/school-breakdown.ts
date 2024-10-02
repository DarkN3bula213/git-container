import { getPayId } from '../../payments/payment.utils';
import StudentModel from '../../students/student.model';

interface SchoolBreakdownResult {
	schoolTotalStrength: number;
	totalRevenueTarget: number;
	totalAmountCollected: number;
	classes: ClassBreakdown[];
}

interface ClassBreakdown {
	class: string;
	classFee: number;
	classRevenueTarget: number;
	students_strength: number;
	paidStudents: number;
	amountGen: number;
	sections: SectionBreakdown[];
}

interface SectionBreakdown {
	section: string;
	students: number;
	paidStudents: number;
	revenueTarget: number;
	amountCollected: number;
}
export const schoolBreakdown = async () => {
	const currentPayId = getPayId();

	const students = await StudentModel.aggregate([
		{
			$lookup: {
				from: 'classes', // Assuming the collection name for classes is 'classes'
				localField: 'className',
				foreignField: 'className',
				as: 'classInfo'
			}
		},
		{ $unwind: '$classInfo' }, // Unwind to make further operations easier
		{
			$lookup: {
				from: 'payments',
				localField: '_id',
				foreignField: 'studentId',
				as: 'paymentInfo'
			}
		},
		{
			$addFields: {
				paid: {
					$anyElementTrue: {
						$map: {
							input: '$paymentInfo',
							as: 'payment',
							in: {
								$eq: ['$$payment.payId', currentPayId]
							}
						}
					}
				}
			}
		},
		{
			$group: {
				_id: {
					className: '$className',
					section: '$section'
				},
				students: { $sum: 1 },
				paidStudents: {
					$sum: { $cond: ['$paid', 1, 0] }
				},
				fee: { $first: '$classInfo.fee' }
			}
		},
		{
			$sort: { '_id.section': 1 } // Sorting sections alphabetically
		},
		{
			$group: {
				_id: '$_id.className',
				sections: {
					$push: {
						section: '$_id.section',
						students: '$students',
						paidStudents: '$paidStudents',
						revenueTarget: {
							$multiply: ['$students', '$fee']
						},
						amountCollected: {
							$multiply: ['$paidStudents', '$fee']
						}
					}
				},
				classFee: { $first: '$fee' },
				totalStudents: { $sum: '$students' },
				totalPaidStudents: { $sum: '$paidStudents' },
				totalRevenueTarget: {
					$sum: {
						$multiply: ['$students', '$fee']
					}
				},
				totalAmountCollected: {
					$sum: {
						$multiply: ['$paidStudents', '$fee']
					}
				}
			}
		},
		{
			$sort: { _id: 1 } // Sorting classes alphabetically
		},
		{
			$group: {
				_id: null,
				schoolTotalStrength: { $sum: '$totalStudents' },
				totalRevenueTarget: {
					$sum: '$totalRevenueTarget'
				},
				totalAmountCollected: {
					$sum: '$totalAmountCollected'
				},
				classes: {
					$push: {
						class: '$_id',
						classFee: '$classFee',
						classRevenueTarget: '$totalRevenueTarget',
						students_strength: '$totalStudents',
						paidStudents: '$totalPaidStudents',
						amountGen: '$totalAmountCollected',
						sections: '$sections'
					}
				}
			}
		},
		// Project to format the final output
		{
			$project: {
				_id: 0,
				schoolTotalStrength: 1,
				totalRevenueTarget: 1,
				totalAmountCollected: 1,
				classes: 1
			}
		}
	]).exec();
	return students as unknown as SchoolBreakdownResult;
};
