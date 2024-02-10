import { ValidationSource, validate } from '@/lib/handlers/validate';

import schema, { Header } from './apiKey.schema';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { ForbiddenError } from '@/lib/api';
import ApiKey, { ApiKeyModel, findByKey } from './apiKey.model';
import { Logger } from '@/lib/logger';

const logger = new Logger(__filename);

import express, { Request, Response, NextFunction } from 'express';
export const useApiKey = (req: Request, res: Response, next: NextFunction) => {
  asyncHandler(async (req, res, next) => {
    const key = req.headers[Header.API_KEY]?.toString();
    if (!key) {
      logger.info('Api key is missing');
      // throw new ForbiddenError();
      return next();
    }

    logger.info('Api key is present');

    const apiKey = await findByKey(key ?? '');
    if (!apiKey) {
      logger.info('Api key is invalid');
      return next();
    }

    req.apiKey = apiKey;
    return next();
  });
};

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
      throw new ForbiddenError();
    }
    
// logger.debug({
//   key:key
// })
    const apiKey = await ApiKeyModel.findOne({ key: key, status: true })
      .lean()
      .exec();
    if (!apiKey) {
      logger.info('Api key is invalid');
      throw new ForbiddenError();
    }
    req.apiKey = apiKey;
    return next();
  }),
);
