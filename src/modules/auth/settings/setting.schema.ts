import { validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';

const toggleSettingSchema = Joi.object({
	settingPath: Joi.string()
		.required()
		.pattern(/^(notificationSettings|appSettings|privacySettings)\.[\w]+$/)
		.messages({
			'string.pattern.base': 'Invalid setting path format'
		}),
	value: Joi.boolean().required()
});

export default {
	changeSettings: validateReq({
		body: toggleSettingSchema
	})
};
