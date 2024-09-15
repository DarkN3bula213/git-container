import { validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';

const getInvoice = validateReq({
    body: Joi.object({
        studentId: Joi.string().required(),
        paymentId: Joi.string().required()
    })
});

export default {
    getInvoice
};
