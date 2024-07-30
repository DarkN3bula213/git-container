import mongoose, { Model, Document, model, Schema, Types } from 'mongoose';
import { Teacher } from '../teachers/teacher.model';
import { SubjectNames } from '@/lib/constants/subject-list';

export interface IClassSubject {
  _id?: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId: string;
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
  classTeacher?: {
    teacherId: Types.ObjectId;
    teacherName: string;
  };
}

/*<!-- 1. Model  ---------------------------( Subjects )->*/

const classSubjectSchema = new Schema<IClassSubject>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      // ref: 'Class',
      required: true,
    },
    name: {
      type: Schema.Types.String,
      required: true, // Add required validation
    },
    level: {
      type: Schema.Types.String,
      required: true, // Add required validation
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      // ref: 'Teacher',
      required: false,
    },
    prescribedBooks: {
      type: [Schema.Types.String],
      required: false,
    },
    subjectId: {
      type: Schema.Types.String,
      required: true, // Add required validation
    },
    teacherName: {
      type: Schema.Types.String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

/*<!-- 2. Model  ---------------------------( Classes )->*/

const schema = new Schema<IClass>(
  {
    className: {
      type: Schema.Types.String,
      enum: [
        'Nursery',
        'Prep',
        '1st',
        '2nd',
        '3rd',
        '4th',
        '5th',
        '6th',
        '7th',
        '8th',
        '9th',
        '10th',
      ],
      trim: true,

      unique: true,
      required: true,
    },
    section: {
      type: [Schema.Types.String],
      required: true,
    },
    fee: {
      type: Schema.Types.Number,
      required: true,
    },
    subjects: {
      type: [classSubjectSchema],
    },
    classTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
export const ClassModel = model<IClass>('Class', schema);
