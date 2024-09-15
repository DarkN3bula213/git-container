import mongoose from 'mongoose';
import PaymentModel from '../payments/payment.model';
import { isBefore, startOfMonth, subDays } from 'date-fns';

async function getBillingCycleMetrics() {
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

// Example usage
getBillingCycleMetrics()
    .then((metrics) => {
        console.log('Billing Cycle Metrics:', JSON.stringify(metrics, null, 2));
    })
    .catch((error) => {
        console.error('Error fetching billing cycle metrics:', error);
    });
