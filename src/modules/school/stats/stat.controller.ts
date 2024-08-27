import { getDynamicKey, DynamicKey } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';

import { schoolAggregationBySession } from '../payments/payment.aggregation';
import { cache } from '@/data/cache/cache.service';

export const getSchoolStatsBySession = asyncHandler(async (req, res) => {
  const { payId } = req.params;
  const key = getDynamicKey(DynamicKey.FEE, payId);
  const cachedStats: string[] = await cache.getWithFallback(key, async () => {
    return await schoolAggregationBySession(payId);
  });
  if (!cachedStats) throw new BadRequestError('Stats not found');
  return new SuccessResponse('Stats fetched successfully', cachedStats).send(
    res,
  );
});
