import Joi from 'joi';

export const singleClass = Joi.object({
  className: Joi.string().required(),
  section: Joi.array().items(Joi.string().required()).required(),
  fee: Joi.number().required(),
});
export const multiClass = Joi.array().items(singleClass);


export const fee = Joi.object({
  fee: Joi.number().required(),
})