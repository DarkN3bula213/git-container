import { Logger } from '@/lib/logger/logger';
import paymentModel from '@/modules/school/payments/payment.model';
import { WorkbookService } from '@/services/data-export/excel';
import { WorkbookOptions } from '@/services/data-export/excel';
import { format } from 'date-fns';
import { writeFileSync } from 'fs';
import { ClassSectionGroup, ExcelRowData, PaymentSummary } from '../types';

export class PaymentExcelService {
	private logger: Logger;

	constructor() {
		this.logger = new Logger('PaymentService');
	}

	/**
	 * Get payments data grouped by class and section, and generate Excel report
	 * @param date The date to get payments for (YYYY-MM-DD)
	 * @param res Express response object
	 * @returns DocumentResponse with Excel file
	 */
	public async getPaymentsDataGrouped(date: string): Promise<Buffer> {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		let payments = await paymentModel.find({
			paymentDate: { $gte: startOfDay, $lte: endOfDay }
		});

		this.logger.debug('payments', payments);

		if (!payments || payments.length === 0) {
			this.logger.error('No payments found for the specified date');
			// Get for today
			payments = await paymentModel.find();
			this.logger.debug(JSON.stringify(payments, null, 2));
		}

		// Group payments by class and section
		const groupedPayments = this.groupPaymentsByClassAndSection(payments);

		// Calculate summary
		const summary = this.calculatePaymentSummary(groupedPayments, payments);

		// Generate Excel workbook
		const excelBuffer = await this.generateExcelReport(summary, date);

		// Save file locally (optional)
		const formattedDate = format(new Date(date), 'yyyy-MM-dd');
		writeFileSync(`payments-${formattedDate}.xlsx`, excelBuffer);

		// Send response
		return excelBuffer;
	}

	/**
	 * Group payments by class and section
	 * @param payments Array of payment documents
	 * @returns Object with payments grouped by class-section
	 */
	private groupPaymentsByClassAndSection(payments: any[]): {
		[key: string]: ClassSectionGroup;
	} {
		return payments.reduce(
			(acc: { [key: string]: ClassSectionGroup }, payment) => {
				const key = `${payment.className}-${payment.section}`;

				if (!acc[key]) {
					acc[key] = {
						className: payment.className,
						section: payment.section,
						payments: [],
						sectionTotal: 0
					};
				}

				acc[key].payments.push({
					studentName: payment.studentName,
					className: payment.className,
					section: payment.section,
					amount: payment.amount,
					paymentDate: payment.paymentDate,
					paymentMethod: payment.paymentMethod,
					paymentStatus: payment.paymentStatus,
					payId: payment.payId,
					paymentType: payment.paymentType,
					invoiceId: payment.invoiceId,
					createdAt: payment.createdAt?.getTime()
				});

				acc[key].sectionTotal += payment.amount;
				return acc;
			},
			{}
		);
	}

	/**
	 * Calculate payment summary statistics
	 * @param groupedPayments Payments grouped by class-section
	 * @param payments Original array of payment documents
	 * @returns Payment summary object
	 */
	private calculatePaymentSummary(
		groupedPayments: { [key: string]: ClassSectionGroup },
		payments: any[]
	): PaymentSummary {
		return {
			classSectionGroups: Object.values(groupedPayments),
			totalAmount: Object.values(groupedPayments).reduce(
				(sum, group) => sum + group.sectionTotal,
				0
			),
			totalPayments: payments.length,
			uniqueClasses: new Set(payments.map((p) => p.className)).size,
			uniqueSections: Object.keys(groupedPayments).length
		};
	}

	/**
	 * Generate Excel report for payments
	 * @param summary Payment summary data
	 * @param date Date string for the report
	 * @returns Promise resolving to Excel file buffer
	 */
	private async generateExcelReport(
		summary: PaymentSummary,
		date: string
	): Promise<Buffer> {
		const workbookService = new WorkbookService();
		const formattedDate = format(new Date(date), 'yyyy-MM-dd');

		const options: WorkbookOptions<ExcelRowData> = {
			title: 'Payment Report',
			heading: `Payments for ${formattedDate}`,
			subHeading: 'Class and Section-wise Summary',
			columnConfig: [
				{
					key: 'studentName' as keyof ExcelRowData,
					label: 'Student Name',
					width: 25
				},
				{
					key: 'className' as keyof ExcelRowData,
					label: 'Class',
					width: 15
				},
				{
					key: 'section' as keyof ExcelRowData,
					label: 'Section',
					width: 10
				},
				{
					key: 'amount' as keyof ExcelRowData,
					label: 'Amount',
					width: 15,
					style: { numFmt: 'Rs. #,##0.00' }
				},
				{
					key: 'paymentMethod' as keyof ExcelRowData,
					label: 'Payment Method',
					width: 15
				},
				{
					key: 'paymentStatus' as keyof ExcelRowData,
					label: 'Status',
					width: 15
				},
				{
					key: 'paymentType' as keyof ExcelRowData,
					label: 'Type',
					width: 15
				},
				{
					key: 'invoiceId' as keyof ExcelRowData,
					label: 'Invoice ID',
					width: 20
				},
				{
					key: 'createdAt' as keyof ExcelRowData,
					label: 'Timestamp',
					width: 20
				}
			]
		};

		// Prepare data for Excel
		const excelData = this.prepareExcelData(summary);

		return workbookService.generateWorkbook(excelData, options);
	}

	/**
	 * Prepare data for Excel with section totals and executive summary
	 * @param summary Payment summary data
	 * @returns Array of row data for Excel
	 */
	private prepareExcelData(summary: PaymentSummary): ExcelRowData[] {
		const excelData: ExcelRowData[] = [];

		// Add class-section groups with their payments and totals
		for (const group of summary.classSectionGroups) {
			// Add a header for the class-section
			excelData.push({
				studentName: `${group.className} - ${group.section}`,
				className: '',
				section: '',
				amount: '',
				paymentMethod: '',
				paymentStatus: '',
				paymentType: '',
				invoiceId: '',
				createdAt: ''
			});

			// Add individual payments
			excelData.push(
				...group.payments.map((payment) => ({
					...payment,
					paymentDate: undefined, // Exclude paymentDate from Excel output
					createdAt: payment.createdAt
						? format(new Date(payment.createdAt), 'HH:mm:ss')
						: ''
				}))
			);

			// Add section total
			excelData.push({
				studentName: 'Section Total',
				className: '',
				section: '',
				amount: group.sectionTotal,
				paymentMethod: '',
				paymentStatus: '',
				paymentType: '',
				invoiceId: '',
				createdAt: ''
			});

			// Add empty row for spacing
			excelData.push({
				studentName: '',
				className: '',
				section: '',
				amount: '',
				paymentMethod: '',
				paymentStatus: '',
				paymentType: '',
				invoiceId: '',
				createdAt: ''
			});
		}

		// Add executive summary
		excelData.push(
			{
				studentName: 'Executive Summary',
				className: '',
				section: '',
				amount: '',
				paymentMethod: '',
				paymentStatus: '',
				paymentType: '',
				invoiceId: '',
				createdAt: ''
			},
			{
				studentName: 'Total Amount',
				className: '',
				section: '',
				amount: summary.totalAmount,
				paymentMethod: '',
				paymentStatus: '',
				paymentType: '',
				invoiceId: '',
				createdAt: ''
			},
			{
				studentName: 'Total Payments',
				className: '',
				section: '',
				amount: summary.totalPayments,
				paymentMethod: '',
				paymentStatus: '',
				paymentType: '',
				invoiceId: '',
				createdAt: ''
			},
			{
				studentName: 'Unique Classes',
				className: '',
				section: '',
				amount: summary.uniqueClasses,
				paymentMethod: '',
				paymentStatus: '',
				paymentType: '',
				invoiceId: '',
				createdAt: ''
			},
			{
				studentName: 'Total Sections',
				className: '',
				section: '',
				amount: summary.uniqueSections,
				paymentMethod: '',
				paymentStatus: '',
				paymentType: '',
				invoiceId: '',
				createdAt: ''
			}
		);

		return excelData;
	}
}
