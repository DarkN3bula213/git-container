import mongoose, { Model, Document, model, Schema, Types } from 'mongoose';
import { Teacher } from '../teachers/teacher.model';
import { SubjectNames } from '@/lib/constants/subject-list';

export interface IClassSubject {
  classId: Types.ObjectId;
  subjectId: string;
  name: string;
  level: string;
  teacherId?: Types.ObjectId;
  prescribedBooks?: string[];
}
export interface IClass extends Document {
  className: string;
  section: string[];
  fee: number;
  subjects?: IClassSubject[];
  classTeacher?: Teacher['_id'];
}

const classSubjectSchema = new Schema<IClassSubject>({
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  name: {
    type: Schema.Types.String,
    enum: Object.values(SubjectNames),
    required: true,
  },
  level: {
    type: Schema.Types.String,
    required: true,
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  prescribedBooks: {
    type: [Schema.Types.String],
  },
  subjectId: {
    type: Schema.Types.String,
  },
});
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
