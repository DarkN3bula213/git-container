import { cache } from '@/data/cache/cache.service';
import asyncHandler from './asyncHandler';
import { Logger } from '../logger';
import { RedisClientType } from 'redis';
const logger = new Logger(__filename);
// export const invalidate = (key: string) => {
//   return asyncHandler(async (req, res, next) => {
//     try {
//       await cache.getClient().del(key)
//       logger.debug({
//         message: `Cache invalidated for key: ${key}`,
//       })
//       next()
//     } catch (error) {
//       logger.error(`Error invalidating cache for key: ${key}`, error)
//       next(error)
//     }
//   })
// }
export const invalidate = (keysOrPattern: string | string[]) => {
  return asyncHandler(async (req, res, next) => {
    const client = cache.getClient();

    try {
      if (Array.isArray(keysOrPattern)) {
        // If an array, handle each element based on its content (could be direct keys or patterns)
        for (const keyOrPattern of keysOrPattern) {
          if (keyOrPattern.includes('*')) {
            // Handle pattern
            await invalidatePattern(client, keyOrPattern);
          } else {
            // Direct key invalidation
            await client.del(keyOrPattern);
          }
        }
      } else if (keysOrPattern.includes('*')) {
        // Single pattern
        await invalidatePattern(client, keysOrPattern);
      } else {
        // Single key
        await client.del(keysOrPattern);
      }

      logger.debug({
        message: `Cache invalidated for: ${keysOrPattern}`,
      });
      next();
    } catch (error) {
      logger.error(`Error invalidating cache for: ${keysOrPattern}`, error);
      next(error);
    }
  });
};
async function invalidatePattern(
  client: RedisClientType,
  pattern: string,
): Promise<void> {
  let cursor = 0;
  do {
    const result = await client.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });
    cursor = result.cursor; // Ensure cursor is correctly interpreted as a number
    const keys = result.keys;
    if (keys.length) {
      await client.del(keys);
    }
  } while (cursor !== 0);
}
