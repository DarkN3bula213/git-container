import mongoose, { Model, Document, model, Schema, Types } from 'mongoose';

export interface IClass extends Document {
  className: string;
  sections: string[];
  fee: number;
}

const sections = ['A', 'B', 'C', 'D', 'E'];
const classNames = [
  'Prep',
  'Nursery',
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
];

const classSchema = new Schema<IClass>({
  className: {
    type: String,
  },
  sections: {
    type: [String],
  },
  fee: {
    type: Number,
  },
});

export const ClassModel = model<IClass>('Class', classSchema);
