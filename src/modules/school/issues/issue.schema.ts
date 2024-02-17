import Joi from 'joi';

export default {
  createIssue: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    isSeen: Joi.boolean(),
    replies: Joi.array().items(Joi.string()), // Adjust if your replies structure is more complex
    author: Joi.string().required(), // Assuming author is passed as a string; adjust as necessary
  }),
};
