import { singleDocumentUpload } from '@/lib/config';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { Expense, Expenses } from './expense.model';

const logger = new Logger('ExpenseController');
/*<!-----------  GET   --------------->*/
export const getExpenses = asyncHandler(async (_req, res) => {
	const expenses = await Expenses.find();
	res.status(200).json({ expenses });
});

export const getExpenseById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const expense = (await Expenses.findById(id)) as Expense;
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
	async (req: Request, res: Response, next: NextFunction) => {
		singleDocumentUpload(req, res, async (err) => {
			if (err instanceof MulterError) {
				logger.error('Error uploading file:', err);
				return res.status(500).json({ error: err.message });
			} else if (err) {
				logger.error('Error uploading file:', err);
				return next(err);
			}

			// Assuming the rest of the form data is available in req.body
			// and the file path is available in req.file.path
			if (req.file) {
				const { title, amount, vendor, date } = req.body;
				const filePath = req.file.path; // The path where the file is saved

				try {
					// Create a new document in the Expense collection
					const expenseData = {
						title,
						amount,
						vendor,
						date,
						filePath
					};

					const newExpense = await Expenses.create(expenseData);
					logger.debug(newExpense);
					res.status(201).json(newExpense);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (error: any) {
					res.status(400).json({
						error: error.message
					});
				}
			} else {
				res.status(402).json({
					error: 'File is required.'
				});
			}
		});
		// Handle where no file was uploaded.
	};
	const {
		amount,
		description,
		date,
		vendor,
		expenseType,
		receipt,
		approvedBy
	} = req.body;

	// Create the expense object, ensuring proper parsing of fields
	const expenseData = {
		amount: parseFloat(amount), // Parse amount to number
		description,
		date: new Date(date), // Ensure date is a Date object
		vendor: vendor, // Handle comma-separated vendor list
		expenseType,
		receipt,
		approvedBy,
		document: req.file ? req.file.path : null // Get file path if the file was uploaded
	};
	logger.debug(expenseData);
	const newExpense = new Expenses(expenseData);
	await newExpense.save();
	res.status(201).json(newExpense);
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
		{ new: true }
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
