import asyncHandler from '@/lib/handlers/asyncHandler';
import { Expenses } from './expense.model';

/*<!-----------  GET   --------------->*/
export const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expenses.find();
  res.status(200).json({ expenses });
});

export const getExpenseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expense = await Expenses.findById(id);
  if (!expense) {
    res.status(404).json({ message: 'Expense not found' });
    return;
  }
  res.status(200).json({ expense });
});

export const getExpensesByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const expenses = await Expenses.find({ type });
  res.status(200).json({ expenses });
});

export const getExpensesByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const expenses = await Expenses.find({ date });
  res.status(200).json({ expenses });
});

/*<!-----------  POST   --------------->*/
export const createExpense = asyncHandler(async (req, res) => {
  const expense = await Expenses.create(req.body);
  res.status(201).json({ expense });
});

export const insertMUltipleExpenses = asyncHandler(async (req, res) => {
  const { expenses } = req.body;
  const newExpenses = await Expenses.insertMany(expenses);
  res.status(201).json({ newExpenses });
});

/*<!-----------  PUT   --------------->*/

export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, amount, date, description } = req.body;
  const expense = await Expenses.findByIdAndUpdate(
    id,
    { type, amount, date, description },
    { new: true },
  );
  res.status(200).json({ expense });
});

/*<!-----------  DELETE   --------------->*/
export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Expenses.findByIdAndDelete(id);
  res.status(204).json();
});

export const resetCollection = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (password !== 'password') {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  await Expenses.deleteMany();
  res.status(204).json();
});
