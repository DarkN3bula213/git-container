import asyncHandler from '@/lib/handlers/asyncHandler';
import expenses from './expense.model';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import { User } from '@/modules/auth/users/user.model';

export const createExpense = asyncHandler(async (req, res) => {
  const user = req.user as User;
  if (!user) throw new BadRequestError('User not found');
  const expenseObject = new expenses({
    ...req.body,
    createdBy: user._id,
  });
  const expense = await expenseObject.save();
  return new SuccessResponse('Expense created successfully', expense).send(res);
});

export const getExpenses = asyncHandler(async (req, res) => {
  const data = await expenses.find();

  return new SuccessResponse('Expenses fetched successfully', data).send(res);
});

export const getExpense = asyncHandler(async (req, res) => {
  const data = await expenses.findById(req.params.id);

  return new SuccessResponse('Expense fetched successfully', data).send(res);
});

export const updateExpense = asyncHandler(async (req, res) => {
  const data = await expenses.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  return new SuccessResponse('Expense updated successfully', data).send(res);
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const data = await expenses.findByIdAndDelete(req.params.id);

  return new SuccessResponse('Expense deleted successfully', data).send(res);
});
