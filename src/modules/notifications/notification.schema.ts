import { validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';

export default {
	create: Joi.object().keys({
		title: Joi.string().required(),
		message: Joi.string().required()
	}),
	markAsDeleted: validateReq({
		params: Joi.object().keys({
			id: Joi.string().required()
		})
	})
};
