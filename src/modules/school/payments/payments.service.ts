import { cache } from '@/data/cache/cache.service';
import { Key } from '@/data/cache/keys';
import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import { Logger } from '@/lib/logger';
import { generateInvoiceToken } from '@/lib/utils/tokens';
import { generateQRCode } from '@/lib/utils/utils';
import { InvoiceProps } from '@/types';
import { ClientSession, startSession } from 'mongoose';
import { Student } from '../students/student.interface';
import StudentModel from '../students/student.model';
import Payments from './payment.model';
import { generateSerial, getPayId } from './payment.utils';

const logger = new Logger(__filename);

class PaymentService {
	async getNextInvoiceId(): Promise<string> {
		return await generateSerial();
	}
	/*===============( GENERATE INVOICE _ )==============================*/
	async generateInvoice(paymentId: string, studentId: string) {
		const payment = await Payments.findById(paymentId);
		if (!payment) throw new BadRequestError('Payment not found');
		const student = (await StudentModel.findById(studentId)
			.select('address father_name description')
			.exec()) as Student;
		if (!student) throw new BadRequestError('Student not found');

		try {
			const tokenPayload: InvoiceProps = {
				studentId: student._id as string,
				studentName: student.name,
				amount: student.tuition_fee,
				class: student.className,
				section: student.section,
				issuedAt: new Date(),
				payId: payment.payId,
				paidOn: payment.paymentDate,
				address: student.address,
				invoiceId: payment.invoiceId,
				guardian: student.father_name,
				balance: 0,
				isAdvanced: false,
				isArrears: false
			};

			const token = generateInvoiceToken(tokenPayload);
			const qrCode = await generateQRCode(token);

			return { token, qrCode };
		} catch (error: any) {
			logger.error(error);
			throw new BadRequestError('Error generating invoice');
		}
	}

	/*===============( OFF CYCLE CREATE PAYMENT )==============================*/
	async createOffBillCyclePayment(
		studentId: string,
		payId: string,
		paymentType: string,
		userId: string
	) {
		return await withTransaction(async (session) => {
			const student =
				await StudentModel.findById(studentId).session(session);
			if (!student) throw new BadRequestError('Student not found');

			const payment = new Payments({
				studentId: student._id,
				studentName: student.name,
				classId: student.classId,
				className: student.className,
				section: student.section,
				amount: student.tuition_fee,
				paymentDate: new Date(),
				createdBy: userId,
				paymentType: paymentType,
				payId: payId,
				invoiceId: await this.getNextInvoiceId()
			});

			const paymentDocument = await payment.save({ session });

			await StudentModel.findByIdAndUpdate(
				studentId,
				{
					$push: {
						paymentHistory: {
							paymentId: paymentDocument._id,
							payID: paymentDocument.payId
						}
					}
				},
				{ session }
			);
			const key = Key.DAILYTOTAL;
			await cache.incrBy(key, student.tuition_fee);

			return paymentDocument;
		});
	}
	/*===============( CREATE REGULAR PAYMENT )==============================*/
	async createPayment(studentId: string, userId: string) {
		return await withTransaction(async (session) => {
			const student =
				await StudentModel.findById(studentId).session(session);
			if (!student) throw new BadRequestError('Student not found');
			const payId = getPayId();
			const invoiceId = await this.getNextInvoiceId();
			const payment = new Payments({
				studentId: student._id,
				studentName: student.name,
				classId: student.classId,
				className: student.className,
				section: student.section,
				amount: student.tuition_fee,
				paymentDate: new Date(),
				createdBy: userId,
				paymentType: 'Standard',
				payId: payId,
				invoiceId: invoiceId
			});
			const paymentDocument = await payment.save({ session });

			await StudentModel.findByIdAndUpdate(
				studentId,
				{
					$push: {
						paymentHistory: {
							paymentId: paymentDocument._id,
							payID: paymentDocument.payId
						}
					}
				},
				{ session }
			);

			const key = Key.DAILYTOTAL;
			await cache.incrBy(key, student.tuition_fee);

			return paymentDocument;
		});
	}
	/*===============( CREATE MULTIPLE REGULAR PAYMENTS )==============================*/
	async commitMultiInsert(studentIds: string[], userId: string) {
		if (!Array.isArray(studentIds) || studentIds.length === 0) {
			throw new BadRequestError('studentIds should be a non-empty array');
		}

		const session: ClientSession = await startSession();
		session.startTransaction();
		try {
			const payId = getPayId();
			const studentData: Student[] = [];

			for (const id of studentIds) {
				const student = (await StudentModel.findById(id).session(
					session
				)) as Student;
				if (!student)
					throw new BadRequestError(`Student not found: ${id}`);
				studentData.push(student);
			}

			// Pre-generate invoice numbers for all payments
			const invoiceIds = [] as string[];
			for (let i = 0; i < studentData.length; i++) {
				invoiceIds.push(await this.getNextInvoiceId());
			}

			const payments = studentData.map((student, index) => ({
				studentId: student._id,
				studentName: student.name,
				classId: student.classId,
				className: student.className,
				section: student.section,
				amount: student.tuition_fee,
				paymentDate: new Date(),
				createdBy: userId,
				paymentType: student.feeType,
				invoiceId: invoiceIds[index],
				payId: payId
			}));

			const paymentDocs = await Payments.insertMany(payments, {
				session
			});

			// Other database operations...
			// Push Entry into Student's Payment History
			await StudentModel.updateMany(
				{ _id: { $in: studentIds } },
				{
					$push: {
						paymentHistory: {
							$each: paymentDocs.map((payment) => ({
								paymentId: payment._id,
								payId: payment.payId,
								amount: payment.amount,
								date: payment.paymentDate
							}))
						}
					}
				},
				{ session }
			);

			await session.commitTransaction();

			// Calculate total amount for this transaction
			const totalAmount = payments.reduce(
				(sum, payment) => sum + payment.amount,
				0
			);

			// Update the money flow in Redis
			const key = Key.DAILYTOTAL;
			await cache.incrBy(key, totalAmount);
			logger.debug(
				`Calculated total amount for this transaction: ${totalAmount}`
			);

			return paymentDocs;
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
	}

	/*===============( DELETE SINGLE PAYMENT )==============================*/
	async deletePayment(paymentId: string) {
		const session: ClientSession = await startSession();
		session.startTransaction();
		try {
			// Find the payment document
			const payment = await Payments.findById(paymentId).session(session);
			if (!payment) {
				throw new BadRequestError('Payment not found');
			}

			// Delete the payment document
			await Payments.findByIdAndDelete(paymentId).session(session);

			// Remove the entry from the student's payment history
			await StudentModel.findByIdAndUpdate(
				payment.studentId,
				{
					$pull: {
						paymentHistory: {
							paymentId: paymentId
						}
					}
				},
				{ session }
			);

			await session.commitTransaction();

			// Update the money flow in Redis
			const key = Key.DAILYTOTAL;
			await cache.decrBy(key, payment.amount);
			return { message: 'Payment deleted successfully' };
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
	}

	/*===============( DELETE MULTIPLE PAYMENTS )==============================*/
	async deleteMultiplePayments(studentIds: string[]) {
		const session: ClientSession = await startSession();
		session.startTransaction();
		const payId = getPayId();
		try {
			// Find the payment documents
			const payments = await Payments.find({
				studentId: { $in: studentIds },
				payId: payId
			}).session(session);
			if (!payments) {
				logger.error('Payments not found');
				throw new BadRequestError('Payments not found');
			}

			// Delete the payment documents
			const paymentIds = payments.map((payment) => payment._id);
			await Payments.deleteMany({
				_id: { $in: paymentIds }
			}).session(session);

			// Remove the entries from the student's payment history
			await StudentModel.updateMany(
				{
					_id: {
						$in: payments.map((payment) => payment.studentId)
					}
				},
				{
					$pull: {
						paymentHistory: {
							paymentId: {
								$in: paymentIds
							}
						}
					}
				},
				{ session }
			);

			await session.commitTransaction();

			// Update the money flow in Redis
			const key = Key.DAILYTOTAL;
			const totalAmount = payments.reduce(
				(sum, payment) => sum + payment.amount,
				0
			);
			await cache.decrBy(key, totalAmount);
			logger.debug(
				`Calculated total amount for this transaction: ${totalAmount}`
			);
			return { message: 'Payments deleted successfully' };
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
	}
}

export default new PaymentService();
