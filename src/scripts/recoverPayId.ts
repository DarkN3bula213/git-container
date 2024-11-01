// Adjust import path as needed
import { Logger as log } from '@/lib/logger';
import PaymentModel, {
	IPayment
} from '@/modules/school/payments/payment.model';
import StudentModel from '@/modules/school/students/student.model';
import mongoose from 'mongoose';

const Logger = new log('payment-id-recovery');

interface Summary {
	totalStudents: number;
	updatedStudents: number;
	errorCount: number;
}

async function rebuildPaymentHistories() {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		Logger.info('Starting payment history rebuild process...');

		// Step 1: Clear all existing payment histories
		const clearResult = await StudentModel.updateMany(
			{},
			{ $unset: { paymentHistory: '' } },
			{ session }
		);

		Logger.info({
			message: 'Cleared existing payment histories',
			clearedCount: clearResult.modifiedCount
		});

		// Step 2: Get all payments and group them by studentId
		const payments = await PaymentModel.find({}, null, { session })
			.sort({ createdAt: 1 }) // Ensure consistent ordering
			.lean();

		Logger.info(`Found ${payments.length} payments to process`);

		// Group payments by studentId
		const paymentsByStudent = new Map<
			string,
			Array<{ paymentId: mongoose.Types.ObjectId; payId: string }>
		>();

		for (const payment of payments) {
			const studentId = payment.studentId.toString();
			if (!paymentsByStudent.has(studentId)) {
				paymentsByStudent.set(studentId, []);
			}

			// Only add if payId exists
			if (payment.payId) {
				paymentsByStudent.get(studentId)?.push({
					paymentId: payment._id,
					payId: payment.payId
				});
			}
		}

		Logger.info(`Grouped payments for ${paymentsByStudent.size} students`);

		// Step 3: Update each student with their payment history
		let successCount = 0;
		let errorCount = 0;

		for (const [studentId, payments] of paymentsByStudent) {
			try {
				// Update student with the new payment history
				const result = await StudentModel.findByIdAndUpdate(
					studentId,
					{
						$set: {
							paymentHistory: payments
						}
					},
					{
						session,
						new: true // Return the updated document
					}
				);

				if (result) {
					successCount++;
					if (successCount % 100 === 0) {
						Logger.info(`Processed ${successCount} students...`);
					}
				} else {
					Logger.warn({
						message: 'Student not found for payments',
						studentId
					});
					errorCount++;
				}
			} catch (error) {
				errorCount++;
				Logger.error({
					message: 'Error updating student payment history',
					studentId,
					error:
						error instanceof Error ? error.message : String(error)
				});
			}
		}

		// Commit the transaction
		await session.commitTransaction();

		const summary = {
			totalPayments: payments.length,
			totalStudentsProcessed: paymentsByStudent.size,
			successfulUpdates: successCount,
			errorCount
		};

		Logger.info({
			message: 'Payment ID recovery completed',
			summary: JSON.stringify(summary, null, 2)
		});

		return summary;
	} catch (error) {
		// Abort transaction on error
		await session.abortTransaction();
		Logger.error({
			message: 'Payment history rebuild failed',
			error: error instanceof Error ? error.message : String(error)
		});
		throw error;
	} finally {
		session.endSession();
	}
}
export async function recoverPaymentIds() {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		Logger.info('Starting payment ID recovery process...');

		// Get all students with payment history
		const students = await StudentModel.find({
			'paymentHistory.paymentId': { $exists: true }
		}).session(session);

		Logger.info(`Found ${students.length} students with payment history`);

		let updatedCount = 0;
		let errorCount = 0;

		// Process each student
		for (const student of students) {
			try {
				const updatedPaymentHistory = await Promise.all(
					student.paymentHistory.map(async (payment) => {
						// Skip if payId already exists and is valid
						if (payment.payId && payment.payId.length > 0) {
							return payment;
						}

						try {
							// Find the corresponding payment document
							const paymentDoc = (await PaymentModel.findById(
								payment.paymentId
							).session(session)) as IPayment | null;

							if (!paymentDoc) {
								Logger.warn({
									message: 'Payment document not found',
									studentId: student._id,
									paymentId: payment.paymentId
								});
								return payment;
							}

							// Return updated payment history entry with payId from payment document
							return {
								paymentId: payment.paymentId,
								payId: paymentDoc.payId
							};
						} catch (error) {
							Logger.error({
								message: 'Error processing individual payment',
								studentId: student._id,
								paymentId: payment.paymentId,
								error:
									error instanceof Error
										? error.message
										: String(error)
							});
							return payment;
						}
					})
				);

				// Update the student document with recovered payIds
				await StudentModel.findByIdAndUpdate(
					student._id,
					{ $set: { paymentHistory: updatedPaymentHistory } },
					{ session }
				);

				updatedCount++;

				// Log progress every 100 students
				if (updatedCount % 100 === 0) {
					Logger.info(`Processed ${updatedCount} students...`);
				}
			} catch (error) {
				errorCount++;
				Logger.error({
					message: 'Error processing student',
					studentId: student._id,
					error:
						error instanceof Error ? error.message : String(error)
				});
			}
		}

		// Commit the transaction
		await session.commitTransaction();

		const summary: Summary = {
			totalStudents: students.length,
			updatedStudents: updatedCount,
			errorCount
		};

		Logger.info({
			message: 'Payment ID recovery completed',
			summary: JSON.stringify(summary, null, 2)
		});

		return summary;
	} catch (error) {
		// Abort transaction on error
		await session.abortTransaction();
		Logger.error({
			message: 'Payment ID recovery failed',
			error: error instanceof Error ? error.message : String(error)
		});
		throw error;
	} finally {
		session.endSession();
	}
}

// If running this as a standalone script
// if (require.main === module) {
// 	// Connect to MongoDB
// 	mongoose
// 		.connect(
// 			process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database'
// 		)
// 		.then(async () => {
// 			Logger.info('Connected to MongoDB');
// 			try {
// 				const result = await recoverPaymentIds();
// 				Logger.info({
// 					message: 'Recovery process completed',
// 					result
// 				});
// 			} catch (error) {
// 				Logger.error('Recovery process failed');
// 			} finally {
// 				await mongoose.disconnect();
// 				Logger.info('Disconnected from MongoDB');
// 			}
// 		})
// 		.catch((error) => {
// 			Logger.error({
// 				message: 'MongoDB connection failed',
// 				error: error instanceof Error ? error.message : String(error)
// 			});
// 			process.exit(1);
// 		});
// }

export default rebuildPaymentHistories;
