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
};

export const register = Joi.object({
  username: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
  father_name: Joi.string().required(),
  gender: Joi.string().required(),
  cnic: Joi.string().required(),
  dob: Joi.date().required(),
  cnic_issued_date: Joi.date().required(),
  cnic_expiry_date: Joi.date().required(),
});

export const insertMany = Joi.array().items(register);
