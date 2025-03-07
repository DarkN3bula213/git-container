import { DocumentMimeTypes, DocumentResponse } from '@/lib/api/ApiResponse';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { PaymentExcelService } from '../services/payments.excel.service';

export const getPaymentsExcel = asyncHandler(async (req, res) => {
	const { date } = req.params;
	const paymentExcelService = new PaymentExcelService();
	const buffer = await paymentExcelService.getPaymentsDataGrouped(date);
	return new DocumentResponse(
		buffer,
		`payments-${date}.xlsx`,
		DocumentMimeTypes.XLSX
	).send(res);
});
