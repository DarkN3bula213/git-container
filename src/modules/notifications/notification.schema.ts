import Joi from 'joi';

export default {
	create: Joi.object().keys({
		title: Joi.string().required(),
		message: Joi.string().required()
	})
};
