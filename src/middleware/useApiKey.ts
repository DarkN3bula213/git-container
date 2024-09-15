/* eslint-disable @typescript-eslint/no-namespace */
import { ValidationSource, validate } from '@/lib/handlers/validate';
import { ForbiddenError } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import type ApiKey from '../modules/auth/apiKey/apiKey.model';
import { findByKey } from '../modules/auth/apiKey/apiKey.model';
import schema, { Header } from '../modules/auth/apiKey/apiKey.schema';

const logger = new Logger(__filename);

import express from 'express';

declare global {
    namespace Express {
        interface Request {
            apiKey: ApiKey;
        }
    }
}

const router = express.Router();

export default router.use(
    validate(schema.apiKey, ValidationSource.HEADER),
    asyncHandler(async (req, _res, next) => {
        const key = req.headers[Header.API_KEY]?.toString();
        if (!key) {
            logger.info('Api key is missing');
            next();
            throw new ForbiddenError();
        }

        const apiKey = await findByKey(key);

        if (!apiKey) {
            logger.info('Api key is invalid');
            // next();
            throw new ForbiddenError();
        }
        req.apiKey = apiKey;
        return next();
    })
);
