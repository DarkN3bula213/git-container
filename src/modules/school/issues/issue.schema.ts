import { JoiObjectId, validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';

export default {
	createIssue: validateReq({
		body: Joi.object({
			title: Joi.string().required(),
			description: Joi.string().required(),
			priority: Joi.string().required(),
			label: Joi.string().required(),
			isSeen: Joi.boolean().optional(),
			replies: Joi.array().items(Joi.string()),
			attachment: Joi.any().optional()
		})
	}),
	reply: Joi.object({
		message: Joi.string().required(),
		issueId: Joi.string().required()
	}),
	deleteIssue: Joi.object({
		issueId: JoiObjectId().required()
	}),
	deleteReply: Joi.object({
		issueId: JoiObjectId().required(),
		replyId: JoiObjectId().required()
	})
};
