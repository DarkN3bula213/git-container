import { Schema, Model, Types, model, FilterQuery } from 'mongoose';
import { Student } from './student.interface';
import { generateUniqueId } from './student.utils';
import { Logger as log } from '@/lib/logger';
import { ClassModel } from '../classes/class.model';

const Logger = new log(__filename);

// Define static methods separately
interface IStudentStaticMethods {
  getClassIdByName(className: string): Promise<Types.ObjectId>;
}

// Combine the model with static methods for the full interface
interface IStudentModel extends Model<Student>, IStudentStaticMethods {}


const studentSchema = new Schema<Student>(
  {
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
  },
  {
    timestamps: true,
    statics: {
      async insertManyWithId(docs: Student[]) {},
    },
  },
);

studentSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.registration_no = await generateUniqueId();

    Logger.debug({
      number_gernerated: this.registration_no,
    });
  }
  next();
});

// Implement the static method
const getClassIdByName: IStudentStaticMethods['getClassIdByName'] = async function (className) {
  const classDoc = await ClassModel.findOne({ className }).exec();
  if (!classDoc) {
    throw new Error(`Class with name ${className} not found`);
  }
  return classDoc._id;
};

// Attach the static method to the schema
studentSchema.statics.getClassIdByName = getClassIdByName;

const StudentModel = model<Student, IStudentModel>('Student', studentSchema);
export default StudentModel;


export const findStudents = async ()=>{
  return StudentModel.find({}).exec();
}

export const findStudent = async (field:FilterQuery<Student>)=>{
  return StudentModel.findOne(field).exec();
}

export const updateStudent = async ()=>{
  return StudentModel.updateMany({}, {$set:{status:{isActive:true}}}).exec();
}

export const deleteStudent = async ()=>{
  return StudentModel.deleteMany({}).exec();
}

