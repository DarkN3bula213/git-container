import { cache } from '@/data/cache/cache.service';
import asyncHandler from './asyncHandler';
import { Logger } from '../logger';
const logger = new Logger(__filename);
export const invalidate = (key: string) => {
  return asyncHandler(async (req, res, next) => {
    try {
      await cache.getClient().del(key);
      logger.debug({
        message: `Cache invalidated for key: ${key}`,
      });
      next();
    } catch (error) {
      logger.error(`Error invalidating cache for key: ${key}`, error);
      next(error);
    }
  });
};
