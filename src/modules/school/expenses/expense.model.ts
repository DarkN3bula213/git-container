import mongoose, {
   model,
   Model,
   Document,
   Schema,
   InferSchemaType,
   Types
} from 'mongoose';

export interface Expense extends Document {
   amount: number;
   description: string;
   date: Date | null;
   vendor?: string | string[];
   expenseType: ExpenseType;
   receipt?: string;
   approvedBy?: string;
   document?: string;
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
   PROCUREMENT = 'Procurement'
}

const expenseSchema = new Schema<Expense>({
   amount: { type: Number, required: true },
   description: { type: String, required: true },
   date: { type: Date, required: true },
   vendor: { type: [String] },
   expenseType: {
      type: String,

      required: true
   },
   receipt: { type: String },
   approvedBy: { type: String },
   document: { type: String }
});

export const Expenses = model<Expense>('Expense', expenseSchema);
