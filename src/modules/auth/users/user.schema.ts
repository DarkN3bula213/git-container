import { JoiObjectId } from '@/lib/handlers/validate';
import Joi from 'joi';

export default {
  register: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
    father_name: Joi.string().required(),
    gender: Joi.string().required(),
    cnic: Joi.string().required(),
    dob: Joi.date().required(),
    cnic_issued_date: Joi.date().required(),
    cnic_expiry_date: Joi.date().required(),
  }),
  login: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
  temporary: Joi.object({
    name: Joi.string().required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name cannot be empty',
    }),
    username: Joi.string().required().messages({
      'string.base': 'Username must be a string',
      'string.empty': 'Username cannot be empty',
    }),
    email: Joi.string().required().messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email cannot be empty',
      'string.email': 'Email must be a valid email',
    }),
    isPrime: Joi.boolean().required().default(false).messages({
      'boolean.base': 'IsPremium must be a boolean',
      'boolean.empty': 'IsPremium cannot be empty',
    }),
    password: Joi.string().required(),
    father_name: Joi.string().optional(),
    gender: Joi.string().optional(),
    cnic: Joi.string().optional(),
    dob: Joi.date().optional(),
    cnic_issued_date: Joi.date().optional(),
    cnic_expiry_date: Joi.date().optional(),
  }),
  changePassword: Joi.object({
    userId: JoiObjectId().required(),
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  }),
};

export const register = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),

  //<!- 1. Optioanl Fields  ---------------------------( x )->

  name: Joi.string().optional(),
  father_name: Joi.string().optional(),
  gender: Joi.string().optional(),
  cnic: Joi.string().optional().allow(''),
  dob: Joi.date().optional(),
  cnic_issued_date: Joi.date().optional(),
  cnic_expiry_date: Joi.date().optional(),
});

export const insertMany = Joi.array().items(register);

export const studentId = Joi.object({
  studentId: JoiObjectId().required(),
});
