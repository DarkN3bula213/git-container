import mongoose from 'mongoose';

import StudentModel from './student.model';

export const studentDetailsWithPayments = async (studentId: string) => {
	const result = await StudentModel.aggregate([
		// Match the student by ID
		{ $match: { _id: new mongoose.Types.ObjectId(studentId) } },

		// Lookup to join with payments collection
		{
			$lookup: {
				from: 'payments', // the collection name in the database
				localField: '_id', // field from the student collection
				foreignField: 'studentId', // field from the payments collection
				as: 'feeDocuments' // the array that will hold all the joined documents
			}
		},

		// Unwind the feeDocuments to sort and then regroup
		{
			$unwind: {
				path: '$feeDocuments',
				preserveNullAndEmptyArrays: true
			}
		},

		// Sort the payments by payId within each student
		{ $sort: { 'feeDocuments.payId': 1 } },

		// Group back to get all feeDocuments in one array
		{
			$group: {
				_id: '$_id',
				root: { $mergeObjects: '$$ROOT' },
				feeDocuments: { $push: '$feeDocuments' }
			}
		},

		// Project to structure the output document
		{
			$replaceRoot: {
				newRoot: {
					$mergeObjects: ['$root', '$$ROOT']
				}
			}
		},
		{ $project: { root: 0 } } // Remove the temporary 'root' field
	]);

	return result;
};
export const allStudentsWithPayments = async (
	payId: string,
	classOrder: { [key: string]: number }
) => {
	return await StudentModel.aggregate([
		{
			$lookup: {
				from: 'payments',
				let: { studentId: '$_id' },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{
										$eq: ['$studentId', '$$studentId']
									},
									{
										$eq: ['$payId', payId]
									}
								]
							}
						}
					}
				],
				as: 'payments'
			}
		},
		{
			$addFields: {
				paid: { $gt: [{ $size: '$payments' }, 0] },
				paymentDetails: {
					$arrayElemAt: ['$payments', 0]
				}
			}
		},
		{
			$addFields: {
				classOrder: {
					$cond: {
						if: {
							$in: ['$className', Object.keys(classOrder)]
						},
						then: { $literal: null },
						else: 99
					}
				}
			}
		},
		{
			$sort: {
				classOrder: 1,
				section: 1
			}
		},
		{
			$project: {
				payments: 0,
				classOrder: 0
			}
		}
	]);
};

export const rootStudentAggregation = async (payId: string) => {
	return await StudentModel.aggregate([
		{
			$lookup: {
				from: 'payments',
				localField: '_id',
				foreignField: 'studentId',
				as: 'payments'
			}
		},
		{
			$addFields: {
				paid: {
					$cond: {
						if: {
							$gt: [
								{
									$size: {
										$filter: {
											input: '$payments',
											as: 'payment',
											cond: {
												$eq: ['$$payment.payId', payId]
											}
										}
									}
								},
								0
							]
						},
						then: true,
						else: false
					}
				}
			}
		},
		{
			$project: {
				payments: 0 // Remove the payments field if not needed in the final output
			}
		}
	]);
};
