import { Document, ObjectId } from 'mongoose';
import { IClass } from '../classes/interfaces';

export type Student = Document & {
	//[+] Personal Information
	name: string;
	dob: Date;
	place_of_birth: string;
	b_form: string;
	gender: string;
	father_name: string;

	//[+] Guardian Information
	address: string;
	cast: string;
	father_occupation: string;
	father_cnic: string;
	religion: string;
	phone: string;

	//[+] School Information
	registration_no: string;
	classId: IClass['_id'];
	className: IClass['className'];
	section: IClass['section'][number];
	tuition_fee: IClass['fee'];
	feeType: string;

	//[+] Financial Information
	admission_fee: number;
	session: string;
	admission_date: Date;
	status: {
		isActive: boolean;
		hasLeft: boolean;
		remarks: string[];
	};
	paymentHistory: Payments[];
	promotionHistory: StudentPromotionHistory[];
	version: number;
};

type Payments = {
	paymentId: ObjectId;
	payID: string;
	payId: string;
};

export type StudentPromotionHistory = {
	previousClassId: string;
	previousClassName: string;
	previousSection: string;
	newClassId: string;
	newClassName: string;
	newSection: string;
	promotionDate: Date;
	oldTuitionFee: number;
	newTuitionFee: number;
};
