import { ValidationSource, validate } from '@/lib/handlers/validate';

import schema, { Header } from '../modules/auth/apiKey/apiKey.schema';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { ForbiddenError } from '@/lib/api';
import ApiKey, {
  ApiKeyModel,
  findByKey,
} from '../modules/auth/apiKey/apiKey.model';
import { Logger } from '@/lib/logger';

const logger = new Logger(__filename);

import express, { Request, Response, NextFunction } from 'express';

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
  asyncHandler(async (req, res, next) => {
    const key = req.headers[Header.API_KEY]?.toString();
    if (!key) {
      logger.info('Api key is missing');
      next();
      throw new ForbiddenError();
    }

    const apiKey = await ApiKeyModel.findOne({ key: key, status: true })
      .lean()
      .exec();

    if (!apiKey) {
      logger.info('Api key is invalid');
      // next();
      throw new ForbiddenError();
    } else {
      req.apiKey = apiKey;

      logger.info('Api key is valid');
    }
    return next();
  }),
);
