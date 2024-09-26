import { JoiObjectId } from '@/lib/handlers/validate';
import Joi from 'joi';

export default {
	createIssue: Joi.object().keys({
		title: Joi.string().required(),
		description: Joi.string().required(),
		tags: Joi.array().items(Joi.string()).optional(),
		status: Joi.string().optional(),
		priority: Joi.string()
			.valid('low', 'medium', 'high', 'urgent')
			.required()
	}),
	getById: Joi.object().keys({
		id: JoiObjectId().required()
	}),
	changeStatus: Joi.object().keys({
		status: Joi.string()
			.valid('backlog', 'inProgress', 'inReview', 'done', 'canceled')
			.required()
	}),
	description: Joi.object().keys({
		description: Joi.string().required()
	}),
	issueId: Joi.object().keys({
		issueId: JoiObjectId().required()
	})
};
