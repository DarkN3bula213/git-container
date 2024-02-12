import mongoose, { Model, Document, model, Schema, Types } from 'mongoose';

export interface IClass extends Document {
  className: string;
  section: string[];
  fee: number;
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
export const ClassModel = model<IClass>('Class', schema);
