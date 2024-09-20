import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';

import { deflateSync } from 'zlib';

import Payments from '../payments/payment.model';
import Students from '../students/student.model';
import Invoice from './invoice.model';
import { generateBarcode, generateQRCode } from './invoice.utils';

/**
 * Controller to generate or retrieve an existing invoice
 */
export const generateInvoice = asyncHandler(async (req, res) => {
	const { studentId, paymentId } = req.body;

	// Step 1: Check if the payment exists
	const payment = await Payments.findOne({ _id: paymentId, studentId });

	if (!payment) {
		// Return an error if payment is not found
		throw new BadRequestError('Payment not found');
	}
	// Step 2: Check if an invoice already exists for the student and payment
	const invoiceDoc = (await Invoice.findOne({
		studentId,
		'feeDetails.paymentId': paymentId
	})) as any;

	if (invoiceDoc) {
		return new SuccessResponse('Invoice already exists', invoiceDoc).send(
			res
		);
	}
	const student = await Students.findOne({ _id: studentId });

	if (!student) {
		throw new BadRequestError('Student not found');
	}
	// Step 3: Generate QR code and Barcode
	const qrCode = await generateQRCode(studentId, paymentId);
	const barcode = await generateBarcode(studentId, paymentId);
	const invoiceData = {
		studentId: payment.studentId,
		studentName: student.name,
		fatherName: student.father_name,
		address: student.address,
		phoneNumber: student.phone,
		className: payment.className,
		section: payment.section,
		amountPaid: payment.amount,
		paymentId: paymentId
	};

	// Step 5: Generate barcode and QR code
	// const barcodeBase64 = await generateBarcode(
	// studentId.toString(),
	// paymentId.toString()
	// );
	const qrCodeBase64 = await generateQRCode(
		studentId.toString(),
		paymentId.toString()
	);

	// Step 6: Compress the base64 strings to reduce the payload size
	//   const compressedBarcode = deflateSync(Buffer.from(barcodeBase64)).toString(
	//     'base64'
	// );
	const compressedQrCode = deflateSync(Buffer.from(qrCodeBase64)).toString(
		'base64'
	);

	// Step 4: Create a new Invoice
	const resData = new Invoice({
		studentId,
		feeDetails: {
			...invoiceData
		},
		invoiceId: payment.invoiceId,
		barcode: barcode,
		qrCode: qrCode,
		jwtToken: compressedQrCode
	}) as any;

	// Step 5: Save the invoice in the database
	await resData.save();

	// Step 6: Return the new invoice
	return new SuccessResponse('Invoice generated successfully', resData).send(
		res
	);
});

export const deleteInvoice = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const invoice = await Invoice.findById(id);
	if (!invoice) {
		throw new BadRequestError('Invoice not found');
	}
	const deletedInvoice = (await Invoice.findByIdAndDelete(id)) as any;
	return new SuccessResponse(
		'Invoice deleted successfully',
		deletedInvoice
	).send(res) as any;
});
