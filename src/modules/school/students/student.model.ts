import { Schema, Model, Types, model } from 'mongoose';
import { Student } from './student.interface';

const schema = new Schema<Student>({
  name: String,
  dob: Date,
  place_of_birth: String,
  form_b: String,
  gender: String,
  father_name: String,
  address: String,
  cast: String,
  father_occupation: String,
  father_cnic: String,
  religion: String,
  phone: String,
  registration_no: String,
  classId: Types.ObjectId,
  className: String,
  section: String,
  feeType: String,
  admission_fee: Number,
  tuition_fee: Number,
  session: String,
  admission_date: Date,
  status: {
    isActive: Boolean,
    hasLeft: Boolean,
    remarks: [String],
  },
  paymentHistory: [
    {
      paymentId: Types.ObjectId,
      payID: String,
    },
  ],
  genRegNo: Function,
});
schema.methods.genRegNo = function () {
  return this.registration_no;
};
export const StudentModel: Model<Student> = model<Student>('Student', schema);

export const findStudent = async () => {
  StudentModel.find({});
};
export const findStudentById = async () => {
  StudentModel.findById({});
};

export const addStudent = async (input: Partial<Student>) => {
  const student = new StudentModel(input);
  await student.save();
  return student;
};

export const insertMany = async (data: Partial<Student[]>) => {
  const student = new StudentModel(data);
  await student.save();
  return student;
};


const uniqueRegNoGenerator=async()=>{
 const format ='xx-xx-xxxx-x'
 const first= Date.now().toString().slice(0,4)
 const second= Math.floor(Math.random()*10000).toString().slice(0,2)
 const third= Math.floor(Math.random()*10000).toString().slice(0,2)
 const fourth= Math.floor(Math.random()*10000).toString().slice(0,2)
}