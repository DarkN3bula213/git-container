import type { Types } from 'mongoose';
import StudentModel from '../students/student.model';
import { getPayId } from './payment.utils';

export async function checkPaymentStatus(className: string, payId: string) {
    return StudentModel.aggregate([
        {
            $match: {
                className: className
            }
        },
        {
            $lookup: {
                from: 'payments',
                localField: '_id',
                foreignField: 'studentId',
                as: 'paymentDetails'
            }
        },
        {
            $addFields: {
                paid: {
                    $anyElementTrue: {
                        $map: {
                            input: '$paymentDetails',
                            as: 'payment',
                            in: {
                                $eq: ['$$payment.payId', payId]
                            }
                        }
                    }
                },
                recordId: {
                    $arrayElemAt: [
                        {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$paymentDetails',
                                        as: 'payment',
                                        cond: {
                                            $eq: ['$$payment.payId', payId]
                                        }
                                    }
                                },
                                as: 'filteredPayment',
                                in: '$$filteredPayment._id'
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $project: {
                name: 1,
                registration_no: 1,
                className: 1,
                section: 1,
                admission_date: 1,
                paid: 1,
                recordId: 1 // Ensure this field is included in the projection
            }
        }
    ]);
}

export const schoolAggregation = async () => {
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
    return students;
};
export const schoolAggregationBySession = async (payId: string) => {

    
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
                                $eq: ['$$payment.payId', payId]
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
                totalPaidStudents: { $sum: '$totalPaidStudents' }, // Added line
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
                totalPaidStudents: 1, // Added line
                totalRevenueTarget: 1,
                totalAmountCollected: 1,
                classes: 1
            }
        }
    ]).exec();
    return students;
};
export const getStudentHistory = async (id: Types.ObjectId) => {
    return await StudentModel.aggregate([
        {
            // Match the student by ID
            $match: {
                _id: id
            }
        },
        {
            // Lookup to join with payments collection
            $lookup: {
                from: 'payments', // the collection to join
                localField: '_id', // field from the input documents
                foreignField: 'studentId', // field from the documents of the "from" collection
                as: 'feeHistory' // output array field
            }
        },
        {
            // Project necessary fields
            $project: {
                // Adjust the projection as per your student document's schema
                name: 1,
                className: 1,
                tuition_fee: 1,
                section: 1,
                feeHistory: {
                    // Map over the feeHistory array to reshape each element
                    $map: {
                        input: '$feeHistory',
                        as: 'payment',
                        in: {
                            payId: '$$payment.payId',
                            paid: '$$payment.paymentDate',
                            amount: '$$payment.amount'
                        }
                    }
                }
            }
        }
    ]);
};
