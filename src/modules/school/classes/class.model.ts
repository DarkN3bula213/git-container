import { type Document, model, Schema, Types } from 'mongoose';
import { generateSubjectId } from './class.utils';
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
      required: true,
    },
    classTeacher: {
      type: {
        teacherId: {
          type: Schema.Types.ObjectId,
          ref: 'Teacher',
        },
        teacherName: {
          type: Schema.Types.String,
        },
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
export const ClassModel = model<IClass>('Class', schema);

export function createIClassSubject(
  data: Partial<IClassSubject>,
  className: string,
  classId: Types.ObjectId,
  teacherName: string,
): IClassSubject {
  if (!data.name) {
    throw new Error('Missing required fields');
  }
  const dataTransform: IClassSubject = {
    _id: data._id ?? new Types.ObjectId(),
    subjectId: generateSubjectId(data.name, className),
    name: data.name,
    teacherId: data.teacherId ?? '', // Ensure optional fields are handled
    classId: classId,
    level: className,
    prescribedBooks: data.prescribedBooks ?? [],
    teacherName: teacherName,
  };
  console.log('Transformed Data:', dataTransform);
  return dataTransform;
}
