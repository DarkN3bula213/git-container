import { validateReq } from '@/lib/handlers/validate';
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
      date: Joi.date().optional()
   }),
   updateExpense: Joi.object().keys({
      type: Joi.string().required(),
      amount: Joi.number().required(),
      date: Joi.date().required(),
      description: Joi.string().required()
   }),

   getExpenseById: Joi.object().keys({
      id: Joi.string().required()
   }),

   getExpensesByType: Joi.object().keys({
      type: Joi.string().required()
   }),

   getExpensesByDate: Joi.object().keys({
      date: Joi.date().required()
   }),

   deleteExpense: Joi.object().keys({
      id: Joi.string().required()
   }),

   insertMUltipleExpenses: Joi.object().keys({
      expenses: Joi.array().items(
         Joi.object().keys({
            type: Joi.string().required(),
            amount: Joi.number().required(),
            date: Joi.date().required(),
            description: Joi.string().required()
         })
      )
   }),

   resetCollection: Joi.object().keys({
      password: Joi.string().required()
   })
};
const expenseValidationSchema = Joi.object({
   amount: Joi.string().required(),
   description: Joi.string().required(),
   date: Joi.date().required(),
   vendor: Joi.alternatives()
      .try(Joi.string(), Joi.array().items(Joi.string()))
      .required(),
   expenseType: Joi.string().required(),
   receipt: Joi.string().optional(),
   approvedBy: Joi.string().optional(),
   document: Joi.string().optional().allow('') // Allow empty or no document
});

// Create a validation schema for FormData
export const createRequest = validateReq({
   body: Joi.object({
      amount: Joi.string()
         .required()
         .custom((value, helpers) => {
            // Attempt to parse the amount as a number
            const parsedValue = parseFloat(value);
            if (isNaN(parsedValue)) {
               return helpers.error('any.invalid', {
                  message: 'Amount must be a number'
               });
            }
            return parsedValue; // Replace the string with the parsed number
         }),
      description: Joi.string().required(),
      date: Joi.string() // Accept the date as a string and validate it as a date
         .required()
         .custom((value, helpers) => {
            const parsedDate = new Date(value);
            if (isNaN(parsedDate.getTime())) {
               return helpers.error('any.invalid', {
                  message: 'Invalid date format'
               });
            }
            return parsedDate; // Replace the string with the parsed Date object
         }),
      vendor: Joi.alternatives()
         .try(Joi.string(), Joi.array().items(Joi.string()))
         .required(),
      expenseType: Joi.string().required(),
      receipt: Joi.string().optional(),
      approvedBy: Joi.string().optional(),
      document: Joi.string().optional().allow('') // Allow empty or no document
   })
});
