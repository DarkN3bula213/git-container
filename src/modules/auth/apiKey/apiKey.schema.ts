import Joi from 'joi';

import { JoiAuthBearer } from '@/lib/handlers/validate';

export const enum Header {
    API_KEY = 'x-api-key',
    AUTHORIZATION = 'authorization'
}

export default {
    apiKey: Joi.object()
        .keys({
            [Header.API_KEY]: Joi.string().required()
        })
        .unknown(true),
    auth: Joi.object()
        .keys({
            authorization: JoiAuthBearer().required()
        })
        .unknown(true)
};
