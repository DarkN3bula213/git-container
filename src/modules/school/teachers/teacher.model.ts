import mongoose, { Document, Schema, Types } from 'mongoose';

import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);

export interface Teacher extends Document {
   _id: Types.ObjectId;
   first_name: string;
   last_name: string;
   gender: string;
   fathers_name: string;
   address: string;
   cnic: string;
   phone: string;
   dob: Date;
   qualification: string;
   yearOfGraduation: string;
   marksObtained: string;
   boardOrUniversity: string;
   designation: string;
   joining_date: Date;
   appointed_by: string;
   package: string;
}

// Mongoose Schema for the Teacher model

const schema = new Schema<Teacher>({
   first_name: {
      type: String,
      required: true
   },
   last_name: {
      type: String,
      required: true
   },
   gender: {
      type: String,
      required: true,
      enum: ['male', 'female']
   },
   fathers_name: {
      type: String,
      required: true
   },
   address: {
      type: String,
      required: true
   },
   cnic: {
      type: String,
      unique: true
   },
   phone: {
      type: String
   },
   dob: {
      type: Date,
      required: true
   },
   qualification: {
      type: String,
      required: true
   },
   yearOfGraduation: {
      type: String,
      required: true
   },
   marksObtained: {
      type: String
   },
   boardOrUniversity: {
      type: String,
      required: true
   },
   designation: {
      type: String,
      required: true
   },
   joining_date: {
      type: Date,
      required: true
   },
   appointed_by: {
      type: String,
      required: true
   },
   package: {
      type: String,
      required: true
   }
});

const TeacherModel = mongoose.model<Teacher>('Teacher', schema);

export default TeacherModel;
