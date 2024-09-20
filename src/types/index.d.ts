export interface InvoiceProps {
	address: string;
	issuedAt: Date;
	paidOn: Date;
	amount: number;
	payId: string;
	invoiceId: string;
	studentId: string;
	guardian: string;
	class: string;
	section: string;
	isArrears: boolean;
	isAdvanced: boolean;
	balance: number;
	studentName: string;
}
