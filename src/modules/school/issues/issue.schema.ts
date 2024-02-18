import Joi from 'joi';

export default {
  createIssue: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    isSeen: Joi.boolean().optional(),
    replies: Joi.array().items(Joi.string()),  

  }),
};
