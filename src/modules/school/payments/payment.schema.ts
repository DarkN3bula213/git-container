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
};
