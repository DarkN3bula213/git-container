import { JoiObjectId } from '@/lib/handlers/validate';
import Joi from 'joi';

export default {
  createPayment: Joi.object().keys({
    studentId: Joi.string().required(),
    classId: Joi.string().optional(),
    className: Joi.string().optional(),
    section: Joi.string().optional(),
    amount: Joi.number().optional(),
    paymentDate: Joi.date().optional(),
    paymentMethod: Joi.string().optional(),
    paymentStatus: Joi.string().optional(),
    payId: Joi.string().optional(),
    paymentType: Joi.string().optional(),
    description: Joi.string().optional(),
    createdBy: Joi.string().optional(),
    updatedBy: Joi.string().optional(),
  }),
  batchPayments: Joi.object().keys({
    studentIds: Joi.array().items(Joi.string()).required(),
  }),
  createPaymentsBulk: Joi.object().keys({
    studentIds: Joi.array().items(Joi.string()).required(),
  }),
  removeBulk: Joi.object().keys({
    ids: Joi.array().items(Joi.string()).required(),
  }),
  payId: Joi.object({
    payId: Joi.string()
      .regex(/^\d{2}\d{2}$/)
      .required(),
  }),
  id: Joi.object().keys({
    id: JoiObjectId().required(),
  }),
  studentId: Joi.object().keys({
    studentId: JoiObjectId().required(),
  }),
  studentIds: Joi.object().keys({
    studentIds: Joi.array().items(JoiObjectId()).required(),
  }),
  className: Joi.object().keys({
    className: Joi.string()
      .valid(
        'Nursery',
        'Prep',
        '1st',
        '2nd',
        '3rd',
        '4th',
        '5th',
        '6th',
        '7th',
        '8th',
        '9th',
        '10th',
      )
      .required(),
  }),
  customPayment: Joi.object({
    payId: Joi.string()
      .regex(/^\d{2}\d{2}$/)
      .required(),
  }),
  insertMultiplePayments: Joi.object().keys({
    studentIds: Joi.array().items(JoiObjectId()).required(),
  }),
};
