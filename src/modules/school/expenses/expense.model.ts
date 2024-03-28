import mongoose, { Document, Schema, Types, model } from 'mongoose';

export interface Expense extends Document {
  amount: number;
  description: string;
  createdBy: Types.ObjectId;
  date: Date;
  vendor: string | string[];
  expenseType: ExpenseType;
  receipt: string;
  approvedBy: string;
}

enum ExpenseType {
  COMPLIANCE = 'Compliance',
  MARKETING = 'Marketing',
  SALES = 'Sales',
  HR = 'HR',
  SALARY = 'Salary',
  MAINTENANCE = 'Maintenance',
  TRANSPORTATION = 'Transportation',
  UTILITIES = 'Utilities',
  LAB_COMPUTER = 'Lab Computer',
  LAB_SCIENCE = 'Lab Science',
  STUDENT_EVENT = 'Student Event',
  FACULTY_EVENT = 'Faculty Event',
  PROCUREMENT = 'Procurement',
}

const schema = new Schema<Expense>({
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  vendor: {
    type: [String],
  },
  expenseType: {
    type: String,
    enum: Object.values(ExpenseType),
    required: true,
  },
  receipt: {
    type: String,
  },
  approvedBy: {
    type: String,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true
});



export default model<Expense>('Expense', schema, 'expenses')