import { Document, ObjectId } from 'mongoose';
import { IClass } from '../classes/class.model';

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
};

type Payments = {
    paymentId: ObjectId;
    payID: string;
};
