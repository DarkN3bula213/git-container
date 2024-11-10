import { IPayment } from './payment.model';

export interface EnhancedPayment extends IPayment {
	isOffCycle: boolean;
	isArrear: boolean;
	isAdvance: boolean;
}

export interface ClassSectionStats {
	className: string;
	section: string;
	expectedRevenue: number;
	collectedRevenue: number;
	students: Set<string>;
	payments: EnhancedPayment[];
	totalAmount: number;
	regularPayments: number;
	offCyclePayments: number;
	advancePayments: number;
	arrearPayments: number;
	paidStudents: Set<string>;
}

export interface ClassSectionData {
	className: string;
	section: string;
	expectedRevenue: number;
	collectedRevenue: number;
	pendingRevenue: number;
	collectionPercentage: number;
	studentsCount: number;
	paidStudentsCount: number;
	unpaidStudentsCount: number;
	paymentPercentage: number;
	paymentsCount: number;
	regularPayments: number;
	offCyclePayments: number;
	advancePayments: number;
	arrearPayments: number;
	averagePaymentAmount: number;
}

export interface PaymentCycleResponse {
	payments: EnhancedPayment[];
	summary: {
		totalExpectedRevenue: number;
		totalCollectedRevenue: number;
		totalPendingRevenue: number;
		overallCollectionPercentage: number;
		weeklyCollections: WeeklyCollection[];
		classSectionData: ClassSectionData[];
		totalPayments: number;
		totalAmount: number;
		advancePayments: number;
		arrearPayments: number;
		amountFromAdvancePayments: number;
		amountFromArrearsPayments: number;
		cycleRange: {
			start: Date;
			end: Date;
		};
		paymentCycle: string;
		regularPayments: number;
		offCyclePayments: number;
		uniqueStudents: number;
	};
}

export interface WeeklyCollection {
	week: number;
	start: Date;
	end: Date;
	amount: number;
}
