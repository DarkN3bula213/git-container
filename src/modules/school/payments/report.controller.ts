import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import type { Student } from '../students/student.interface';
import {
  checkPaymentStatus,
  getStudentPaymentRecord,
  schoolAggregation,
  schoolAggregationBySession,
} from './payment.aggregation';
import { getPayId } from './payment.utils';

/*<!-- 1. Aggregation Functions  ----------------( Get Students With Payments ) */
export const getPayStatusMappingByClass = asyncHandler(async (req, res) => {
  const { className } = req.params;
  const payId = getPayId();

  const students: Student[] = await checkPaymentStatus(className, payId);

  return new SuccessResponse('Student payments', students).send(res);
});

/*<!-- 2. Aggregation Functions  ----------------( School Stats ) */
export const getSchoolCurrentRevenue = asyncHandler(async (_req, res) => {
  const key = getDynamicKey(DynamicKey.FEE, 'STATCURRENT');
  const cachedStats = await cache.get(key, async () => {
    return await schoolAggregation();
  });
  if (!cachedStats) throw new BadRequestError('Stats not found');
  return new SuccessResponse('Stats fetched successfully', cachedStats).send(
    res,
  );
});

/*<!-- 3. Aggregation Functions  ----------------( School Stats By Session ) */
export const getSchoolRevenueByPayId = asyncHandler(async (req, res) => {
  const { payId } = req.params;
  const key = getDynamicKey(DynamicKey.FEE, payId);
  const cachedStats = await cache.get(key, async () => {
    return await schoolAggregationBySession(payId);
  });
  if (!cachedStats) throw new BadRequestError('Stats not found');
  return new SuccessResponse('Stats fetched successfully', cachedStats).send(
    res,
  );
});

/*<!-- 4. Aggregations  ---------------------( Get Student History )-> */

export const getStudentPaymentsById = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const history = await getStudentPaymentRecord(studentId);
  return new SuccessResponse('Student payment history', history).send(res);
});
