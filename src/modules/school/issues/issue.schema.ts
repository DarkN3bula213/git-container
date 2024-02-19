import Joi from 'joi';

export default {
  createIssue: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    isSeen: Joi.boolean().optional(),
    replies: Joi.array().items(Joi.string()),
    author: Joi.string().optional(),
  }),
  updateIssue: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    isSeen: Joi.boolean().optional(),
    replies: Joi.array().items(Joi.string()),
    author: Joi.string().optional(),
  }),
  deleteIssue: Joi.object({
    id: Joi.string().required(),
  }),
  reply: Joi.object({
    issueId: Joi.string().required(),
    message: Joi.string().required(),
  }),
  removeReply: Joi.object({
    issueId: Joi.string().required(),
    replyId: Joi.string().required(),
  })
};
