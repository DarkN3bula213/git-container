import Joi from 'joi';

export const sessionSchema = Joi.object({
	userID: Joi.string().required(),
	startTime: Joi.date().required(),
	endTime: Joi.date().required(),
	time: Joi.string().required()
});
