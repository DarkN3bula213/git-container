import { Router } from 'express';
import * as controller from './payment.controller';
import type { RouteMap } from '@/types/routes';
import attachRoles from '@/middleware/attachRoles';
import { Roles } from '@/lib/constants';
import { authorize } from '@/middleware/authorize';
import { setRouter } from '@/lib/utils/utils';
import { invalidate } from '@/lib/handlers/cache.handler';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import schema from './payment.schema';
import { ValidationSource, validate } from '@/lib/handlers/validate';

const router = Router();

const getRouteMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'post',
      validations: [
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.createPayment,
    },
    {
      path: '/stats',
      method: 'get',

      handler: controller.getSchoolStats,
    },
    {
      path: '/custom',
      method: 'post',
      validations: [invalidate(getDynamicKey(DynamicKey.FEE, 'all'))],
      handler: controller.makeCustomPayment,
    },
    {
      path: '/multi-insert',
      method: 'post',
      validations: [
        validate(schema.createPaymentsBulk),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.createPaymentsBulk,
    },
    {
      path: '/',
      method: 'get',
      handler: controller.getPayments,
    },
    {
      path: '/id/:id',
      method: 'get',
      handler: controller.getPaymentById,
    },
    {
      path: '/stats',
      method: 'get',
      handler: controller.getPaymentById,
    },
    {
      path: '/stats/id/:id',
      method: 'get',
      validations: [validate(schema.payId)],
      handler: controller.getPaymentById,
    },
    // {
    //   path: '/student/:studentId',
    //   method: 'get',
    //   handler: controller.getPaymentsByStudentId,
    // },
    {
      path: '/history/:studentId',
      method: 'get',
      validations: [validate(schema.studentId, ValidationSource.PARAM)],
      handler: controller.getStudentPaymentHistory,
    },
    {
      path: '/class/:className',
      method: 'get',
      handler: controller.getStudentPaymentsByClass,
    },
    {
      path: '/payId/:payId',
      method: 'get',
      handler: controller.getMonthsPayments,
    },
    {
      path: '/id/:id',
      method: 'delete',
      validations: [
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.deletePayment,
    },
    {
      path: '/id/:id',
      method: 'put',
      validations: [
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.updatePayment,
    },
    {
      path: '/reset',
      method: 'delete',
      validations: [
        attachRoles(Roles.ADMIN),
        authorize(Roles.ADMIN),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.resetCollection,
    },
    {
      path: '/delete',
      method: 'delete',
      validations: [
        validate(schema.removeBulk),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.deleteManyByID,
    },
    {
      path: '/queue',
      method: 'post',
      validations: [
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.enqueuePaymentCreation,
    },
    {
      path: '/queues',
      method: 'post',
      validations: [
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.enqueueMultiplePayments,
    },
    {
      path: '/batch',
      method: 'post',
      validations: [
        validate(schema.batchPayments),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.handleBatchPayments,
    },
  ];
};

setRouter(router, getRouteMap());
export default router;
