import { isBefore, subDays } from 'date-fns';
import { endOfMonth, startOfMonth } from 'date-fns';
import { PipelineStage } from 'mongoose';
import PaymentModel from '../payments/payment.model';
import { getPayId } from '../payments/payment.utils';
import StudentModel from '../students/student.model';

export async function getBillingCycleMetrics() {
	const today = new Date();
	const startOfBillingCycle = startOfMonth(today);
	const sevenDaysAgo = subDays(today, 7);

	// Convert dates to ISO strings for MongoDB
	const startOfBillingCycleISO = startOfBillingCycle.toISOString();
	const todayISO = today.toISOString();
	const startDateFor7Days = isBefore(sevenDaysAgo, startOfBillingCycle)
		? startOfBillingCycle
		: sevenDaysAgo;
	const startDateFor7DaysISO = startDateFor7Days.toISOString();

	const payId = getPayId();
	// Build the aggregation pipeline
	const pipeline = [
		{
			// Stage 1: Match payments from the start of the billing cycle till today
			$match: {
				paymentDate: {
					$gte: new Date(startOfBillingCycleISO),
					$lte: new Date(todayISO)
				}
			}
		},
		{
			// Stage 2: Add fields to identify if the payment is within the past 7 days and if it's an arrear
			$addFields: {
				isInPast7Days: {
					$gte: ['$paymentDate', new Date(startDateFor7DaysISO)]
				},
				// Extract month and year from payId
				payMonth: { $substr: ['$payId', 0, 2] },
				payYear: { $substr: ['$payId', 2, 2] },
				// Convert two-digit year to four-digit year
				payYearFull: {
					$concat: ['20', { $substr: ['$payId', 2, 2] }]
				},
				// Construct date string in 'YYYY-MM-DD' format
				payDateString: {
					$concat: [
						{ $concat: ['20', { $substr: ['$payId', 2, 2] }] },
						'-',
						{ $substr: ['$payId', 0, 2] },
						'-01'
					]
				},
				// Parse the date string into a date object
				payDate: {
					$dateFromString: {
						dateString: '$payDateString',
						format: '%Y-%m-%d'
					}
				},
				// Identify if the payment is for a previous billing cycle
				isArrear: {
					$lt: ['$payDate', new Date(startOfBillingCycleISO)]
				},
				// Identify if the payment is not for the current billing cycle
				isNonBillCycleDeposit: {
					$ne: ['$payId', payId]
				}
			}
		},
		{
			// Stage 3: Lookup student information to get tuition fees
			$lookup: {
				from: 'students',
				localField: 'studentId',
				foreignField: '_id',
				as: 'student'
			}
		},
		{
			// Stage 4: Unwind the student array
			$unwind: '$student'
		},
		{
			// Stage 5: Group data for overall metrics
			$group: {
				_id: null,
				totalPayments: { $sum: 1 },
				totalRevenue: { $sum: '$amount' },
				totalPaymentsPast7Days: {
					$sum: {
						$cond: [{ $eq: ['$isInPast7Days', true] }, 1, 0]
					}
				},
				totalRevenuePast7Days: {
					$sum: {
						$cond: [{ $eq: ['$isInPast7Days', true] }, '$amount', 0]
					}
				},
				arrearRevenue: {
					$sum: {
						$cond: [{ $eq: ['$isArrear', true] }, '$amount', 0]
					}
				},
				nonBillCycleDeposits: {
					$sum: {
						$cond: [{ $eq: ['$isNonBillCycleDeposit', true] }, 1, 0]
					}
				},
				nonBillCycleRevenue: {
					$sum: {
						$cond: [
							{ $eq: ['$isNonBillCycleDeposit', true] },
							'$amount',
							0
						]
					}
				},
				studentsPaid: { $addToSet: '$studentId' },
				tuitionFees: { $push: '$student.tuition_fee' },
				classMetrics: {
					$push: {
						className: '$className',
						section: '$section',
						isInPast7Days: '$isInPast7Days',
						amount: '$amount'
					}
				}
			}
		},
		{
			// Stage 6: Lookup all active students to calculate collection target
			$lookup: {
				from: 'students',
				pipeline: [
					{ $match: { 'status.isActive': true } },
					{
						$group: {
							_id: null,
							totalStudents: { $sum: 1 },
							totalTuitionFees: { $sum: '$tuition_fee' },
							classStudentCounts: {
								$push: {
									className: '$className',
									section: '$section',
									tuition_fee: '$tuition_fee'
								}
							}
						}
					}
				],
				as: 'studentMetrics'
			}
		},
		{
			// Stage 7: Prepare the final result
			$project: {
				_id: 0,
				totalPayments: 1,
				totalRevenue: 1,
				totalPaymentsPast7Days: 1,
				totalRevenuePast7Days: 1,
				arrearRevenue: 1,
				nonBillCycleDeposits: 1,
				nonBillCycleRevenue: 1,
				studentsPaidCount: { $size: '$studentsPaid' },
				collectionTarget: {
					$arrayElemAt: ['$studentMetrics.totalTuitionFees', 0]
				},
				totalStudents: {
					$arrayElemAt: ['$studentMetrics.totalStudents', 0]
				},
				classMetrics: 1,
				classStudentCounts: {
					$arrayElemAt: ['$studentMetrics.classStudentCounts', 0]
				}
			}
		},
		{
			// Stage 8: Calculate progress ratios and students remaining
			$addFields: {
				progressRatio: {
					$divide: ['$totalRevenue', '$collectionTarget']
				},
				studentsRemaining: {
					$subtract: ['$totalStudents', '$studentsPaidCount']
				}
			}
		},
		{
			// Stage 9: Unwind class metrics for granular data
			$unwind: '$classMetrics'
		},
		{
			// Stage 10: Group by class and section
			$group: {
				_id: {
					className: '$classMetrics.className',
					section: '$classMetrics.section'
				},
				totalPayments: { $sum: 1 },
				totalRevenue: { $sum: '$classMetrics.amount' },
				totalPaymentsPast7Days: {
					$sum: {
						$cond: [
							{ $eq: ['$classMetrics.isInPast7Days', true] },
							1,
							0
						]
					}
				},
				totalRevenuePast7Days: {
					$sum: {
						$cond: [
							{ $eq: ['$classMetrics.isInPast7Days', true] },
							'$classMetrics.amount',
							0
						]
					}
				}
			}
		},
		{
			// Stage 11: Prepare final class metrics
			$project: {
				_id: 0,
				className: '$_id.className',
				section: '$_id.section',
				totalPayments: 1,
				totalRevenue: 1,
				totalPaymentsPast7Days: 1,
				totalRevenuePast7Days: 1
			}
		},
		{
			// Stage 12: Group everything together
			$group: {
				_id: null,
				overallMetrics: {
					$first: {
						totalPayments: '$totalPayments',
						totalRevenue: '$totalRevenue',
						totalPaymentsPast7Days: '$totalPaymentsPast7Days',
						totalRevenuePast7Days: '$totalRevenuePast7Days',
						arrearRevenue: '$arrearRevenue',
						nonBillCycleDeposits: '$nonBillCycleDeposits', // Include this
						nonBillCycleRevenue: '$nonBillCycleRevenue', // Include this
						studentsPaidCount: '$studentsPaidCount',
						totalStudents: '$totalStudents',
						collectionTarget: '$collectionTarget',
						progressRatio: '$progressRatio',
						studentsRemaining: '$studentsRemaining'
					}
				},
				classMetrics: {
					$push: {
						className: '$className',
						section: '$section',
						totalPayments: '$totalPayments',
						totalRevenue: '$totalRevenue',
						totalPaymentsPast7Days: '$totalPaymentsPast7Days',
						totalRevenuePast7Days: '$totalRevenuePast7Days'
					}
				}
			}
		},

		{
			// Stage 13: Project final result
			$project: {
				_id: 0,
				overallMetrics: 1,
				classMetrics: 1
			}
		}
	];

	// Execute the aggregation pipeline
	const result = await PaymentModel.aggregate(pipeline).exec();

	// Return the metrics
	return result.length > 0 ? result[0] : {};
}

export const schoolAggregationBySession = async (payId: string) => {
	// Extract the month and year from payId (format MMYY)
	const month = parseInt(payId.substring(0, 2), 10); // MM (month)
	const year = parseInt(`20${payId.substring(2, 4)}`, 10); // YY (year)

	// Calculate the start and end of the billing month using date-fns
	const startOfBillingCycle = startOfMonth(new Date(year, month - 1));
	const endOfBillingCycle = endOfMonth(new Date(year, month - 1));

	const students = await StudentModel.aggregate([
		{
			$lookup: {
				from: 'classes',
				localField: 'className',
				foreignField: 'className',
				as: 'classInfo'
			}
		},
		{ $unwind: '$classInfo' },
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
				// Only consider payments created within the billing cycle, ensure it's not null
				paymentsWithinBillingCycle: {
					$ifNull: [
						{
							$filter: {
								input: '$paymentInfo',
								as: 'payment',
								cond: {
									$and: [
										{
											$gte: [
												'$$payment.createdAt',
												startOfBillingCycle
											]
										},
										{
											$lte: [
												'$$payment.createdAt',
												endOfBillingCycle
											]
										}
									]
								}
							}
						},
						[]
					]
				},
				// Payments for previous billing cycles (arrears), ensure it's not null
				arrearPayments: {
					$ifNull: [
						{
							$filter: {
								input: '$paymentInfo',
								as: 'payment',
								cond: { $lt: ['$$payment.payId', payId] } // Lexicographic comparison for arrears
							}
						},
						[]
					]
				},
				// Payments for the current billing cycle, ensure it's not null
				currentCyclePayments: {
					$ifNull: [
						{
							$filter: {
								input: '$paymentInfo',
								as: 'payment',
								cond: { $eq: ['$$payment.payId', payId] }
							}
						},
						[]
					]
				},
				// Payments for future billing cycles (advance), ensure it's not null
				advancePayments: {
					$ifNull: [
						{
							$filter: {
								input: '$paymentInfo',
								as: 'payment',
								cond: { $gt: ['$$payment.payId', payId] } // Lexicographic comparison for future payments
							}
						},
						[]
					]
				}
			}
		},
		{
			$addFields: {
				// Determine if the student paid in the current billing cycle
				paid: {
					$anyElementTrue: {
						$map: {
							input: '$currentCyclePayments',
							as: 'payment',
							in: { $eq: ['$$payment.payId', payId] }
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
				fee: { $first: '$classInfo.fee' },
				arrearCount: { $sum: { $size: '$arrearPayments' } },
				advanceCount: { $sum: { $size: '$advancePayments' } }
			}
		},
		{
			$sort: { '_id.section': 1 }
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
						},
						arrearPayments: '$arrearCount',
						advancePayments: '$advanceCount'
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
				},
				totalArrears: { $sum: '$arrearCount' },
				totalAdvances: { $sum: '$advanceCount' },
				totalArrearAmount: { $sum: { $sum: '$arrearPayments.amount' } },
				totalAdvanceAmount: {
					$sum: { $sum: '$advancePayments.amount' }
				}
			}
		},
		{
			$sort: { _id: 1 }
		},
		{
			$group: {
				_id: null,
				schoolTotalStrength: { $sum: '$totalStudents' },
				totalPaidStudents: { $sum: '$totalPaidStudents' },
				totalRevenueTarget: {
					$sum: '$totalRevenueTarget'
				},
				totalAmountCollected: {
					$sum: '$totalAmountCollected'
				},
				totalArrears: { $sum: '$totalArrears' },
				totalAdvances: { $sum: '$totalAdvances' },
				totalOutOfCyclePayments: {
					$sum: { $add: ['$totalArrears', '$totalAdvances'] }
				},
				totalOutOfCycleAmount: {
					$sum: {
						$add: ['$totalArrearAmount', '$totalAdvanceAmount']
					}
				},

				classes: {
					$push: {
						class: '$_id',
						classFee: '$classFee',
						classRevenueTarget: '$totalRevenueTarget',
						students_strength: '$totalStudents',
						paidStudents: '$totalPaidStudents',
						amountGen: '$totalAmountCollected',
						arrearPayments: '$totalArrears',
						advancePayments: '$totalAdvances',
						sections: '$sections'
					}
				}
			}
		},
		{
			$project: {
				_id: 0,
				schoolTotalStrength: 1,
				totalPaidStudents: 1,
				totalRevenueTarget: 1,
				totalAmountCollected: 1,
				totalArrears: 1,
				totalAdvances: 1,
				totalOutOfCyclePayments: 1,
				totalOutOfCycleAmount: 1,
				classes: 1
			}
		}
	]).exec();

	return students;
};

export const getSchoolStatisticsForBillingCycle = async (payId: string) => {
	const month = parseInt(payId.substring(0, 2), 10); // MM (month)
	const year = parseInt(`20${payId.substring(2, 4)}`, 10); // YY (year)

	// Calculate the start and end of the billing month
	const startOfBillingCycle = new Date(year, month - 1, 1);
	const endOfBillingCycle = new Date(year, month, 0);

	const aggregationPipeline: PipelineStage[] = [
		// Step 1: Join the Students with their Payments
		{
			$lookup: {
				from: 'payments',
				localField: '_id',
				foreignField: 'studentId',
				as: 'paymentInfo'
			}
		},

		// Step 2: Handle empty or missing payment info
		{
			$addFields: {
				paymentInfo: { $ifNull: ['$paymentInfo', []] }
			}
		},

		// Step 3: Filter and classify payments based on payId and creation date
		{
			$addFields: {
				// Current billing payments: matches payId exactly
				currentBillingPayments: {
					$filter: {
						input: '$paymentInfo',
						as: 'payment',
						cond: { $eq: ['$$payment.payId', payId] }
					}
				},
				// Out of cycle payments: different payId but payment made within billing cycle
				outOfCyclePayments: {
					$filter: {
						input: '$paymentInfo',
						as: 'payment',
						cond: {
							$and: [
								// Payment was made within this billing cycle
								{
									$gte: [
										'$$payment.createdAt',
										startOfBillingCycle
									]
								},
								{
									$lte: [
										'$$payment.createdAt',
										endOfBillingCycle
									]
								},
								// But has a different payId (indicating it's for a different month)
								{ $ne: ['$$payment.payId', payId] }
							]
						}
					}
				}
			}
		},

		// Step 4: Unwind class sections to handle each section individually
		{ $unwind: '$section' },

		// Step 5: Group by class and section to compute stats
		{
			$group: {
				_id: {
					className: '$className',
					section: '$section'
				},
				students: { $sum: 1 },
				paidStudents: {
					$sum: {
						$cond: [
							{ $gt: [{ $size: '$currentBillingPayments' }, 0] },
							1,
							0
						]
					}
				},
				outOfCyclePayments: { $sum: { $size: '$outOfCyclePayments' } },
				revenueTarget: { $sum: '$tuition_fee' },
				amountCollected: {
					$sum: {
						$cond: [
							{ $gt: [{ $size: '$currentBillingPayments' }, 0] },
							'$tuition_fee',
							0
						]
					}
				},
				outOfCycleAmount: {
					$sum: { $sum: '$outOfCyclePayments.amount' }
				}
			}
		},

		// Rest of the pipeline remains the same
		{
			$sort: { '_id.section': 1 }
		},
		{
			$group: {
				_id: '$_id.className',
				students_strength: { $sum: '$students' },
				paidStudents: { $sum: '$paidStudents' },
				classRevenueTarget: { $sum: '$revenueTarget' },
				amountCollected: { $sum: '$amountCollected' },
				totalOutOfCyclePayments: { $sum: '$outOfCyclePayments' },
				totalOutOfCycleAmount: { $sum: '$outOfCycleAmount' },
				sections: {
					$push: {
						section: '$_id.section',
						students_strength: '$students',
						paidStudents: '$paidStudents',
						revenueTarget: '$revenueTarget',
						amountCollected: '$amountCollected'
					}
				}
			}
		},
		{
			$sort: { _id: 1 }
		},
		{
			$group: {
				_id: null,
				schoolTotalStrength: { $sum: '$students_strength' },
				totalPaidStudents: { $sum: '$paidStudents' },
				totalRevenueTarget: { $sum: '$classRevenueTarget' },
				totalAmountCollected: { $sum: '$amountCollected' },
				totalOutOfCyclePayments: { $sum: '$totalOutOfCyclePayments' },
				totalOutOfCycleAmount: { $sum: '$totalOutOfCycleAmount' },
				classes: {
					$push: {
						class: '$_id',
						students_strength: '$students_strength',
						paidStudents: '$paidStudents',
						revenueTarget: '$classRevenueTarget',
						amountCollected: '$amountCollected',
						sections: '$sections'
					}
				}
			}
		},
		{
			$project: {
				_id: 0,
				schoolTotalStrength: 1,
				totalPaidStudents: 1,
				totalRevenueTarget: 1,
				totalAmountCollected: 1,
				totalOutOfCyclePayments: 1,
				totalOutOfCycleAmount: 1,
				classes: 1
			}
		}
	];

	const results = await StudentModel.aggregate(aggregationPipeline).exec();
	return results;
};
