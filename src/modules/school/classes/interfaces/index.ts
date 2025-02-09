import { Document, Types } from 'mongoose';

export interface IFeeHistory {
	fee: number;
	effectiveFrom: Date;
	reason?: string;
	updatedBy: Types.ObjectId;
}
export interface IClassSubject {
	// _id?: Types.ObjectId;
	// classId: Types.ObjectId;
	subjectId: string;
	code?: string;
	name: string;
	level: string;
	teacherId?: string;
	teacherName?: string;
	prescribedBooks?: string[];
}
export interface IClass extends Document {
	className: string;
	section: string[];
	fee: number;
	subjects: IClassSubject[];
	sections: IClassSection[];
	feeHistory: IFeeHistory[];
	classTeacher?: {
		teacherId: Types.ObjectId;
		teacherName: string;
	};
	updatedBy?: {
		userId: Types.ObjectId;
		userName: string;
	};
}
export interface IClassSection {
	section: 'A' | 'B' | 'C' | 'D' | 'E';
	teacherId: Types.ObjectId;
	teacherName: string;
	configuration: 'mixed' | 'boys' | 'girls';
}

export type AddSubjectsToClassRequestBody = {
	name: string;
	teacherId?: string;
	teacherName: string;
};
export interface ClassWithSectionCounts {
	_id: string;
	className: string;
	fee: number;
	subjects: any[];
	classTeacher?: {
		teacherId: string;
		teacherName: string;
	};
	sections: Array<{
		name: string;
		studentCount: number;
	}>;
	totalStudents: number;
}
