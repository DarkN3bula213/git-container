import mongoose, { Schema, Document } from 'mongoose';

export interface IIDTracker extends Document {
  date: string; // Format: YYMMDD
  lastSequence: number;
  checkDigit: number;
}

const idTrackerSchema: Schema = new Schema({
  date: { type: String, required: true, unique: true },
  lastSequence: { type: Number, required: true },
  checkDigit: { type: Number, required: true },
});

export const IDTrackerModel = mongoose.model<IIDTracker>(
  'IDTracker',
  idTrackerSchema,
);
