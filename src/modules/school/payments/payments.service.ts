import { cache } from '@/data/cache/cache.service';
import { Key } from '@/data/cache/keys';
import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import { Logger } from '@/lib/logger';
import { generateInvoiceToken } from '@/lib/utils/tokens';
import {
	generateQRCode,
	sortStudentsByClassAndSection
} from '@/lib/utils/utils';
import { InvoiceProps } from '@/types';
import {
	addWeeks,
	endOfMonth,
	isAfter,
	isBefore,
	isWithinInterval,
	startOfMonth,
	startOfWeek
} from 'date-fns';
import { Student } from '../students/student.interface';
import StudentModel from '../students/student.model';
import {
	ClassSectionData,
	ClassSectionStats,
	EnhancedPayment,
	PaymentCycleResponse,
	WeeklyCollection
} from './payment.interfaces';
import Payments from './payment.model';
import {
	generateClassSectionKey,
	generateSerial,
	getBillingMonthDate,
	getPayId,
	parsePayId
} from './payment.utils';

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

			const updatedStudent = await StudentModel.findByIdAndUpdate(
				studentId,

				{
					$push: {
						paymentHistory: {
							paymentId: paymentDocument._id,
							payId: paymentDocument.payId,
							invoiceId: paymentDocument.invoiceId
						}
					},
					$inc: { version: 1 }
				},
				{ session, runValidators: true, new: true }
			);
			if (!updatedStudent) {
				throw new BadRequestError('Concurrent modification detected');
			}
			const key = Key.DAILYTOTAL;
			await cache.incrBy(key, student.tuition_fee);

			return paymentDocument;
		});
	}
	/*===============( CREATE REGULAR PAYMENT )==============================*/
	async createPayment(studentId: string, userId: string) {
		return await withTransaction(async (session) => {
			// Use findOneAndUpdate with upsert to atomically check and create payment
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const student =
				await StudentModel.findById(studentId).session(session);
			if (!student) throw new BadRequestError('Student not found');

			// Atomic operation to check and create payment
			const existingPayment = await Payments.findOneAndUpdate(
				{
					studentId: student._id,
					paymentDate: { $gte: today }
				},
				{},
				{ session }
			);

			if (existingPayment) {
				throw new BadRequestError('Payment already exists for today');
			}

			const payId = getPayId();
			const invoiceId = await this.getNextInvoiceId();

			// Create payment with optimistic locking
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
				invoiceId: invoiceId,
				version: 1 // Add version control
			});

			const paymentDocument = await payment.save({ session });

			// Use findOneAndUpdate with version control for atomic update
			const updatedStudent = await StudentModel.findOneAndUpdate(
				{
					_id: studentId,
					version: student.version // Add version field to StudentModel
				},
				{
					$push: {
						paymentHistory: {
							paymentId: paymentDocument._id,
							payId: paymentDocument.payId,
							invoiceId: paymentDocument.invoiceId
						}
					},
					$inc: { version: 1 }
				},
				{
					new: true,
					session,
					runValidators: true
				}
			);

			if (!updatedStudent) {
				throw new BadRequestError('Concurrent modification detected');
			}

			// Use atomic increment for cache
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

		return await withTransaction(async (session) => {
			const payId = getPayId();

			// Check for existing payments in bulk
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const existingPayments = await Payments.find({
				studentId: { $in: studentIds },
				paymentDate: { $gte: today }
			}).session(session);

			if (existingPayments.length > 0) {
				const duplicateStudents = existingPayments.map(
					(p) => p.studentId
				);
				throw new BadRequestError(
					`Payments already exist for students: ${duplicateStudents.join(', ')}`
				);
			}
			const studentData: Student[] = [];
			for (const id of studentIds) {
				const student = (await StudentModel.findById(id).session(
					session
				)) as Student;
				if (!student)
					throw new BadRequestError(`Student not found: ${id}`);
				studentData.push(student);
			}

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

			await StudentModel.updateMany(
				{ _id: { $in: studentIds } },
				{
					$push: {
						paymentHistory: {
							$each: paymentDocs.map(
								(payment: {
									_id: any;
									payId: any;
									invoiceId: string;
								}) => ({
									paymentId: payment._id,
									payId: payment.payId,
									invoiceId: payment.invoiceId
								})
							)
						}
					}
				},
				{ session }
			);

			const totalAmount = payments.reduce(
				(sum, payment) => sum + payment.amount,
				0
			);
			const key = Key.DAILYTOTAL;
			await cache.incrBy(key, totalAmount);
			logger.debug(
				`Calculated total amount for this transaction: ${totalAmount}`
			);

			return paymentDocs;
		});
	}

	/*===============( DELETE SINGLE PAYMENT )==============================*/
	async deletePayment(paymentId: string) {
		return await withTransaction(async (session) => {
			const payment = await Payments.findById(paymentId).session(session);
			if (!payment) throw new BadRequestError('Payment not found');

			await Payments.findByIdAndDelete(paymentId).session(session);

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

			const key = Key.DAILYTOTAL;
			await cache.decrBy(key, payment.amount);

			return { message: 'Payment deleted successfully' };
		});
	}

	/*===============( DELETE MULTIPLE PAYMENTS )==============================*/
	async deleteMultiplePayments(studentIds: string[]) {
		return await withTransaction(async (session) => {
			const payId = getPayId();

			// Find the payment documents
			const payments = await Payments.find({
				studentId: { $in: studentIds },
				payId: payId
			}).session(session);

			if (!payments || payments.length === 0) {
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
					_id: { $in: payments.map((payment) => payment.studentId) }
				},
				{
					$pull: {
						paymentHistory: {
							paymentId: { $in: paymentIds }
						}
					}
				},
				{ session }
			);

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
		});
	}
	async customSorting() {
		const students = await StudentModel.find({}).lean();
		return sortStudentsByClassAndSection(students);
	}

	/*===============( GET PAYMENTS FOR CYCLE )==============================*/
	async getPaymentsForCycle(payId: string): Promise<PaymentCycleResponse> {
		const billingDate = parsePayId(payId);
		const cycleStart = startOfMonth(billingDate);
		const cycleEnd = endOfMonth(billingDate);

		// **1. Get all students and calculate total expected revenue**
		const allStudents = await StudentModel.find().lean();
		const studentStrength = allStudents.length;
		const classSectionStats = new Map<string, ClassSectionStats>();
		let totalExpectedRevenue = 0;

		for (const student of allStudents) {
			const key = generateClassSectionKey(
				student.className,
				student.section
			);
			if (!classSectionStats.has(key)) {
				classSectionStats.set(key, {
					className: student.className,
					section: student.section,
					expectedRevenue: 0,
					collectedRevenue: 0,
					students: new Set(),
					payments: [],
					totalAmount: 0,
					regularPayments: 0,
					offCyclePayments: 0,
					advancePayments: 0,
					arrearPayments: 0,
					paidStudents: new Set()
				});
			}
			const stats = classSectionStats.get(key)!;
			stats.expectedRevenue += student.tuition_fee;
			totalExpectedRevenue += student.tuition_fee;
			stats.students.add(student._id.toString());
		}

		// **2. Fetch and enhance payments**
		const payments = await Payments.find({
			$or: [
				{ payId },
				{
					payId: { $ne: payId },
					createdAt: {
						$gte: cycleStart,
						$lte: cycleEnd
					}
				}
			]
		}).lean();

		const billingMonthCache = new Map<string, { start: Date; end: Date }>();
		const enhancedPayments: EnhancedPayment[] = payments.map((payment) => {
			const createdAtDate = new Date(payment.createdAt);

			if (!billingMonthCache.has(payment.payId)) {
				const billingMonthDate = getBillingMonthDate(payment.payId);
				const billingMonthStart = startOfMonth(billingMonthDate);
				const billingMonthEnd = endOfMonth(billingMonthDate);
				billingMonthCache.set(payment.payId, {
					start: billingMonthStart,
					end: billingMonthEnd
				});
			}

			const { start: billingMonthStart, end: billingMonthEnd } =
				billingMonthCache.get(payment.payId)!;

			return {
				...payment,
				isOffCycle:
					payment.payId !== payId ||
					createdAtDate < cycleStart ||
					createdAtDate > cycleEnd,
				isArrear: isAfter(createdAtDate, billingMonthEnd),
				isAdvance: isBefore(createdAtDate, billingMonthStart)
			} as EnhancedPayment;
		});

		// **3. Calculate total collected revenue**
		const totalCollectedRevenue = enhancedPayments.reduce(
			(sum, payment) => {
				if (payment.isAdvance) {
					return sum;
				}
				if (payment.payId === payId || payment.isArrear) {
					return sum + payment.amount;
				}
				return sum;
			},
			0
		);

		// **4. Weekly Collections**
		const weeks = [1, 2, 3, 4];
		const weeklyCollections: WeeklyCollection[] = weeks.map((week) => ({
			week,
			start: addWeeks(
				startOfWeek(cycleStart, { weekStartsOn: 1 }),
				week - 1
			),
			end: addWeeks(startOfWeek(cycleStart, { weekStartsOn: 1 }), week),
			amount: 0
		}));

		for (const payment of enhancedPayments) {
			for (const week of weeklyCollections) {
				if (
					isWithinInterval(new Date(payment.createdAt), {
						start: week.start,
						end: week.end
					})
				) {
					week.amount += payment.amount;
					break;
				}
			}
		}

		// **5. Update class and section stats with payments**
		for (const payment of enhancedPayments) {
			const key = generateClassSectionKey(
				payment.className,
				payment.section
			);
			const stats = classSectionStats.get(key);
			if (stats) {
				stats.collectedRevenue += payment.amount;
				stats.payments.push(payment);
				stats.totalAmount += payment.amount;
				stats.paidStudents.add(payment.studentId.toString());
				stats.regularPayments += payment.isOffCycle ? 0 : 1;
				stats.offCyclePayments += payment.isOffCycle ? 1 : 0;
				stats.advancePayments += payment.isAdvance ? 1 : 0;
				stats.arrearPayments += payment.isArrear ? 1 : 0;
			}
		}

		// **6. Generate class section data for response**
		const classSectionData: ClassSectionData[] = Array.from(
			classSectionStats.values()
		).map((stats) => {
			const paidStudentsCount = stats.paidStudents.size;
			const unpaidStudentsCount = stats.students.size - paidStudentsCount;

			return {
				className: stats.className,
				section: stats.section,
				expectedRevenue: stats.expectedRevenue,
				collectedRevenue: stats.collectedRevenue,
				pendingRevenue: stats.expectedRevenue - stats.collectedRevenue,
				collectionPercentage: stats.expectedRevenue
					? Math.round(
							(stats.collectedRevenue / stats.expectedRevenue) *
								100
						)
					: 0,
				studentsCount: stats.students.size,
				paidStudentsCount,
				unpaidStudentsCount,
				paymentPercentage: stats.students.size
					? Math.round(
							(paidStudentsCount / stats.students.size) * 100
						)
					: 0,
				paymentsCount: stats.payments.length,
				regularPayments: stats.regularPayments,
				offCyclePayments: stats.offCyclePayments,
				advancePayments: stats.advancePayments,
				arrearPayments: stats.arrearPayments,
				averagePaymentAmount: stats.payments.length
					? Math.round(
							(stats.totalAmount / stats.payments.length) * 100
						) / 100
					: 0
			};
		});

		// **7. Compile final summary**
		const summary = {
			totalExpectedRevenue,
			totalCollectedRevenue,
			studentStrength,
			totalPendingRevenue: totalExpectedRevenue - totalCollectedRevenue,
			overallCollectionPercentage: totalExpectedRevenue
				? Math.round(
						(totalCollectedRevenue / totalExpectedRevenue) * 100
					)
				: 0,
			weeklyCollections,
			classSectionData,
			totalPayments: enhancedPayments.length,
			totalAmount: enhancedPayments.reduce((sum, p) => sum + p.amount, 0),
			advancePayments: enhancedPayments.filter((p) => p.isAdvance).length,
			arrearPayments: enhancedPayments.filter((p) => p.isArrear).length,
			amountFromAdvancePayments: enhancedPayments
				.filter((p) => p.isAdvance)
				.reduce((sum, p) => sum + p.amount, 0),
			amountFromArrearsPayments: enhancedPayments
				.filter((p) => p.isArrear)
				.reduce((sum, p) => sum + p.amount, 0),
			cycleRange: {
				start: cycleStart,
				end: cycleEnd
			},
			paymentCycle: payId,
			regularPayments: enhancedPayments.filter((p) => !p.isOffCycle)
				.length,
			offCyclePayments: enhancedPayments.filter((p) => p.isOffCycle)
				.length,
			uniqueStudents: new Set(
				enhancedPayments.map((p) => p.studentId.toString())
			).size
		};
		// **8. Return the result**
		return {
			payments: enhancedPayments,
			summary
		};
	}
}

export default new PaymentService();
