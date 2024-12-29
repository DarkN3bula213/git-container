import { ProductionLogger } from '@/lib/logger/v1/logger';
import PaymentModel, {
	IPayment
} from '@/modules/school/payments/payment.model';
import StudentModel from '@/modules/school/students/student.model';
import mongoose from 'mongoose';

const Logger = new ProductionLogger('payment-id-recovery');

interface Summary {
	totalStudents: number;
	updatedStudents: number;
	errorCount: number;
}
async function rebuildPaymentHistories() {
	const session = await mongoose.startSession({
		defaultTransactionOptions: {
			readPreference: 'primary',
			readConcern: { level: 'local' },
			writeConcern: { w: 'majority' },
			maxTimeMS: 30000 // 30 second timeout
		}
	});

	const BATCH_SIZE = 100;
	const MAX_RETRIES = 3;
	const RETRY_DELAY = 5000;

	const sleep = (ms: number) =>
		new Promise((resolve) => setTimeout(resolve, ms));

	const retryOperation = async <T>(
		operation: () => Promise<T>,
		operationName: string
	): Promise<T> => {
		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				return await operation();
			} catch (error) {
				const isLockError =
					error instanceof Error &&
					error.message.includes('Unable to acquire') &&
					error.message.includes('lock');

				if (isLockError && attempt < MAX_RETRIES) {
					Logger.warn(`${operationName} failed due to lock error`);
					await sleep(RETRY_DELAY * attempt);
					continue;
				}
				throw error;
			}
		}
		throw new Error(
			`${operationName} failed after ${MAX_RETRIES} attempts`
		);
	};

	try {
		session.startTransaction();
		Logger.info('Starting payment history rebuild process...');

		// Step 1: Clear all existing payment histories in batches
		let clearedCount = 0;
		const studentsCursor = StudentModel.find({}).cursor();
		let studentBatch: mongoose.Types.ObjectId[] = [];

		for await (const student of studentsCursor) {
			studentBatch.push(student._id as mongoose.Types.ObjectId);

			if (studentBatch.length === BATCH_SIZE) {
				await retryOperation(async () => {
					const result = await StudentModel.updateMany(
						{ _id: { $in: studentBatch } },
						{ $unset: { paymentHistory: '' } },
						{ session }
					);
					clearedCount += result.modifiedCount;
				}, 'Clear payment histories batch');

				Logger.info(`Cleared ${clearedCount} payment histories`);
				studentBatch = [];
			}
		}

		// Clear remaining students
		if (studentBatch.length > 0) {
			await retryOperation(async () => {
				const result = await StudentModel.updateMany(
					{ _id: { $in: studentBatch } },
					{ $unset: { paymentHistory: '' } },
					{ session }
				);
				clearedCount += result.modifiedCount;
			}, 'Clear final payment histories batch');
		}

		Logger.info(`Cleared all existing payment histories ${clearedCount}`);

		// Step 2: Get and process payments in batches
		const paymentsByStudent = new Map<
			string,
			Array<{ paymentId: mongoose.Types.ObjectId; payId: string }>
		>();
		let processedPayments = 0;
		const paymentsCursor = PaymentModel.find({})
			.sort({ createdAt: 1 })
			.cursor();

		for await (const payment of paymentsCursor) {
			if (payment.studentId && payment.payId) {
				const studentId = payment.studentId?.toString();
				if (!paymentsByStudent.has(studentId)) {
					paymentsByStudent.set(studentId, []);
				}
				paymentsByStudent.get(studentId)?.push({
					paymentId: payment._id as mongoose.Types.ObjectId,
					payId: payment.payId
				});
			}

			processedPayments++;
			if (processedPayments % 1000 === 0) {
				Logger.info(`Processed ${processedPayments} payments...`);
			}
		}

		Logger.info(
			`Grouped ${processedPayments} payments for ${paymentsByStudent.size} students`
		);

		// Step 3: Update students in batches
		let successCount = 0;
		let errorCount = 0;
		let studentBatchCount = 0;
		const studentEntries = Array.from(paymentsByStudent.entries());

		for (let i = 0; i < studentEntries.length; i += BATCH_SIZE) {
			const batch = studentEntries.slice(i, i + BATCH_SIZE);
			studentBatchCount++;

			await retryOperation(async () => {
				await Promise.all(
					batch.map(async ([studentId, payments]) => {
						try {
							const result = await StudentModel.findByIdAndUpdate(
								studentId,
								{ $set: { paymentHistory: payments } },
								{ session, new: true }
							);

							if (result) {
								successCount++;
							} else {
								Logger.warn(
									`No result found for student ${studentId} and payment ${payments}`
								);
								errorCount++;
							}
						} catch (error) {
							errorCount++;
							Logger.error(
								`Error updating student payment history ${studentId}: ${error}`
							);
						}
					})
				);
			}, `Update students batch ${studentBatchCount}`);

			// Logger.info({
			// 	message: 'Batch progress',
			// 	processedStudents: successCount,
			// 	totalStudents: studentEntries.length,
			// 	progress: `${((successCount / studentEntries.length) * 100).toFixed(2)}%`,
			// 	currentBatch: studentBatchCount
			// });
		}

		await retryOperation(async () => {
			await session.commitTransaction();
		}, 'Commit transaction');

		const summary = {
			totalPayments: processedPayments,
			totalStudentsProcessed: paymentsByStudent.size,
			successfulUpdates: successCount,
			errorCount
		};

		Logger.info(`Payment history rebuild completed ${summary}`);

		return summary;
	} catch (error) {
		await session.abortTransaction();
		Logger.error(`Payment history rebuild failed ${error}`);
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
								Logger.warn(
									`Payment document not found for student ${student._id} and payment ${payment.paymentId}`
								);
								return payment;
							}

							// Return updated payment history entry with payId from payment document
							return {
								paymentId: payment.paymentId,
								payId: paymentDoc.payId
							};
						} catch (error) {
							Logger.error(
								`Error processing individual payment for student ${student._id} and payment ${payment.paymentId}: ${error}`
							);
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
				Logger.error(
					`Error processing student ${student._id}: ${error}`
				);
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
		Logger.error(`Payment ID recovery failed ${error}`);
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
