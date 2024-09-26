import { JoiObjectId } from '@/lib/handlers/validate';
import Joi from 'joi';

export default {
	createIssue: Joi.object({
		title: Joi.string().required(),
		description: Joi.string().required(),
		isSeen: Joi.boolean().optional(),
		replies: Joi.array().items(Joi.string())
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
