import { JoiObjectId, validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';

export default {
	getClassSubjects: validateReq({
		params: Joi.object({
			classId: JoiObjectId().required()
		})
	})
};
