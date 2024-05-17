import mongoose from 'mongoose';

export interface IPayment extends mongoose.Document {
  studentId: mongoose.Schema.Types.ObjectId;
  classId: mongoose.Schema.Types.ObjectId;
  className: string;
  section: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  paymentStatus: string;
  payId: string;
  paymentType: string;
  description: string;
  createdBy: mongoose.Schema.Types.ObjectId;
  updatedBy: mongoose.Schema.Types.ObjectId;
}

const schema = new mongoose.Schema<IPayment>({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  className: { type: String, required: true },
  section: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  paymentMethod: {
    type: String,
    default: 'cash',
  },
  paymentStatus: {
    type: String,
    default: 'success',
  },
  payId: { type: String, required: true },
  paymentType: {
    type: String,
    default: 'full',
  },
  description: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// Add unique index on studentId and payId

schema.index({ studentId: 1, payId: 1 }, { unique: true });

export default mongoose.model<IPayment>('Payment', schema);
