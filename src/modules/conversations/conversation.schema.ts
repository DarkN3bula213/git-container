import { JoiObjectId, validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';

export default {
	deleteMessage: validateReq({
		params: Joi.object({
			id: JoiObjectId
		})
	})
};
