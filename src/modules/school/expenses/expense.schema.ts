import Joi from 'joi';

export default {
  createExpense: Joi.object().keys({
    amount: Joi.number().optional(),
    description: Joi.string().optional(),
    vendor: Joi.string().optional(),
    receipt: Joi.string().optional(),
    approvedBy: Joi.string().optional(),
    document: Joi.string().optional(),
    expenseType: Joi.string().optional(),

    type: Joi.string().optional(),
    date: Joi.date().optional(),
  }),
  updateExpense: Joi.object().keys({
    type: Joi.string().required(),
    amount: Joi.number().required(),
    date: Joi.date().required(),
    description: Joi.string().required(),
  }),

  getExpenseById: Joi.object().keys({
    id: Joi.string().required(),
  }),

  getExpensesByType: Joi.object().keys({
    type: Joi.string().required(),
  }),

  getExpensesByDate: Joi.object().keys({
    date: Joi.date().required(),
  }),

  deleteExpense: Joi.object().keys({
    id: Joi.string().required(),
  }),

  insertMUltipleExpenses: Joi.object().keys({
    expenses: Joi.array().items(
      Joi.object().keys({
        type: Joi.string().required(),
        amount: Joi.number().required(),
        date: Joi.date().required(),
        description: Joi.string().required(),
      }),
    ),
  }),

  resetCollection: Joi.object().keys({
    password: Joi.string().required(),
  }),
};
