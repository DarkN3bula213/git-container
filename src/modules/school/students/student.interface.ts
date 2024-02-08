import { Document, ObjectId } from 'mongoose';

export type Student = Document & {
  //[+] Personal Information
  name: string;
  dob: Date;
  place_of_birth: string;
  form_b: string;
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
  classId: ObjectId;
  className: string;
  section: string;
  feeType: string;

  //[+] Financial Information
  admission_fee: number;
  tuition_fee: number;
  session: string;
  admission_date: Date;
  status: {
    isActive: boolean;
    hasLeft: boolean;
    remarks: string[];
  };
  paymentHistory: Payments[];
  genRegNo(): Promise<string>;
};


type Payments = {
  paymentId: ObjectId;
  payID: string;
};