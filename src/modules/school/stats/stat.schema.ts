import { validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';

export default {
  schoolStats: validateReq({
    params: Joi.object({
      payId: Joi.string()
        .regex(/^\d{2}\d{2}$/)
        .required(),
    }),
  }),
};
