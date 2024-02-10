import Joi from 'joi';

export const singleClass = Joi.object({
  className: Joi.string().required(),
  sections: Joi.string().required(),
  fee: Joi.number().required(),
});

export const multiClass = Joi.array().items(singleClass);
