import { getDynamicKey, DynamicKey, Key } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { schoolAggregationBySession } from './stat.aggregations';
import { cache } from '@/data/cache/cache.service';
import StudentModel from '../students/student.model';
import paymentModel from '../payments/payment.model';
export const getSchoolStatsBySession = asyncHandler(async (req, res) => {
    const { payId } = req.params;
    const key = getDynamicKey(DynamicKey.FEE, payId);
    const cachedStats: string[] = await schoolAggregationBySession(payId);
    if (!cachedStats) throw new BadRequestError('Stats not found');
    return new SuccessResponse('Stats fetched successfully', cachedStats).send(
        res
    );
});

export const getUnpaidStudentsList = asyncHandler(async (req, res) => {
    const { payId } = req.params;

    const unpaidStudents = (await StudentModel.find({
        _id: {
            $nin: await paymentModel.distinct('studentId', { payId: payId })
        }
    })) as object[];
    return new SuccessResponse(
        'Stats fetched successfully',
        unpaidStudents
    ).send(res);
});
export const getTodaysCollection = asyncHandler(async (req, res) => {
    const key = Key.DAILYTOTAL;
    const totalAmount = await cache.get<number>(key);

    if (!totalAmount || totalAmount === 0) {
        return new SuccessResponse('Stats fetched successfully', 0).send(res);
    } else {
        return new SuccessResponse(
            'Stats fetched successfully',
            totalAmount
        ).send(res);
    }
});
