import { cache } from '@/data/cache/cache.service';
import { Logger } from '@/lib/logger';
import { NextFunction, Request, Response } from 'express';
import { RedisClientType } from 'redis';
import asyncHandler from './asyncHandler';

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
async function performInvalidation(keysOrPattern: string | string[]) {
	const client = cache.getClient();

	if (Array.isArray(keysOrPattern)) {
		for (const keyOrPattern of keysOrPattern) {
			if (keyOrPattern.includes('*')) {
				await invalidatePattern(client, keyOrPattern);
			} else {
				await client.del(keyOrPattern);
			}
			logger.info(`Invalidated ${keysOrPattern} keys`);
		}
	} else if (keysOrPattern.includes('*')) {
		await invalidatePattern(client, keysOrPattern);
	} else {
		await client.del(keysOrPattern);
	}

	logger.debug(`Cache invalidated for: ${keysOrPattern}`);
}
// export const invalidate = (keysOrPattern: string | string[]) => {
// 	return asyncHandler(async (_req, _res, next) => {
// 		const client = cache.getClient();

// 		try {
// 			if (Array.isArray(keysOrPattern)) {
// 				// If an array, handle each element based on its content (could be direct keys or patterns)
// 				for (const keyOrPattern of keysOrPattern) {
// 					if (keyOrPattern.includes('*')) {
// 						// Handle pattern
// 						await invalidatePattern(client, keyOrPattern);
// 					} else {
// 						// Direct key invalidation
// 						await client.del(keyOrPattern);
// 					}
// 				}
// 			} else if (keysOrPattern.includes('*')) {
// 				// Single pattern
// 				await invalidatePattern(client, keysOrPattern);
// 			} else {
// 				// Single key
// 				await client.del(keysOrPattern);
// 			}

// 			logger.debug({
// 				message: `Cache invalidated for: ${keysOrPattern}`
// 			});
// 			next();
// 		} catch (error) {
// 			logger.error(
// 				`Error invalidating cache for: ${keysOrPattern}`,
// 				error
// 			);
// 			next(error);
// 		}
// 	});
// };

// Original middleware for direct cache invalidation
export const invalidate = (keysOrPattern: string | string[]) => {
	return asyncHandler(async (_req, _res, next) => {
		try {
			await performInvalidation(keysOrPattern);
			next();
		} catch (error) {
			logger.error(
				`Error invalidating cache for: ${keysOrPattern}`,
				error
			);
			next(error);
		}
	});
};

async function invalidatePattern(
	client: RedisClientType,
	pattern: string
): Promise<void> {
	let cursor = 0;
	do {
		const result = await client.scan(cursor, {
			MATCH: pattern,
			COUNT: 100
		});
		cursor = result.cursor; // Ensure cursor is correctly interpreted as a number
		const keys = result.keys;
		if (keys.length) {
			await client.del(keys);
		}
	} while (cursor !== 0);
}

// New middleware for conditional cache invalidation based on response status
export const invalidateOnSuccess = (keysOrPattern: string | string[]) => {
	return asyncHandler(
		async (req: Request, res: Response, next: NextFunction) => {
			const originalJson = res.json;
			const originalSend = res.send;

			res.json = function (data) {
				return handleResponse(this, data, originalJson);
			};

			res.send = function (data) {
				return handleResponse(this, data, originalSend);
			};

			function handleResponse(
				response: Response,
				data: any,
				originalFn: (body: any) => Response
			) {
				const statusCode = response.statusCode || 200;

				if (statusCode >= 200 && statusCode < 300) {
					performInvalidation(keysOrPattern).catch((err) => {
						logger.error('Cache invalidation failed:', err);
					});
				}
				return originalFn.call(response, data);
			}
			logger.debug(`Invalidating after success: ${keysOrPattern}`);
			next();
		}
	);
};
