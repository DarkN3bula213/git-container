export interface GroupedPaymentData {
	studentName: string;
	className: string;
	section: string;
	amount: number;
	paymentDate: Date;
	paymentMethod: string;
	paymentStatus: string;
	payId: string;
	paymentType: string;
	invoiceId: string;
	createdAt: number;
}

export interface ExcelRowData {
	studentName: string;
	className: string;
	section: string;
	amount: number | string;
	paymentMethod: string;
	paymentStatus: string;
	paymentType: string;
	invoiceId: string;
	createdAt: string;
}

export interface ClassSectionGroup {
	className: string;
	section: string;
	payments: GroupedPaymentData[];
	sectionTotal: number;
}

export interface PaymentSummary {
	classSectionGroups: ClassSectionGroup[];
	totalAmount: number;
	totalPayments: number;
	uniqueClasses: number;
	uniqueSections: number;
}

// Interfaces
// interface ClassSectionGroup {
// 	className: string;
// 	section: string;
// 	payments: PaymentData[];
// 	sectionTotal: number;
// }
