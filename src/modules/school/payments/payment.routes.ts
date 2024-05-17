import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { Roles } from '@/lib/constants';
import { invalidate } from '@/lib/handlers/cache.handler';
import { ValidationSource, validate } from '@/lib/handlers/validate';
import { setRouter } from '@/lib/utils/utils';
import attachRoles from '@/middleware/attachRoles';
import { authorize } from '@/middleware/authorize';
import type { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './payment.controller';
import schema from './payment.schema';
import * as report from './report.controller';

const router = Router();

const getRouteMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getPayments,
    },
    {
      path: '/class/:className',
      method: 'get',
      validations: [validate(schema.className, ValidationSource.PARAM)],
      handler: report.getPayStatusMappingByClass,
    },
    {
      path: '/payId/:payId',
      method: 'get',
      validations: [validate(schema.payId, ValidationSource.PARAM)],
      handler: controller.getMonthsPayments,
    },
    {
      path: '/',
      method: 'post',
      validations: [
        validate(schema.studentId),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.createPayment,
    },
    {
      path: '/stats',
      method: 'get',
      handler: report.getSchoolCurrentRevenue,
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
        validate(schema.insertMultiplePayments),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.createPaymentsBulk,
    },
    {
      path: '/stats/id/:id',
      method: 'get',
      validations: [validate(schema.payId)],
      handler: report.getSchoolRevenueByPayId,
    },
    {
      path: '/student/:studentId',
      method: 'get',
      handler: controller.getPaymentsByStudentId,
    },
    // {
    //   path: '/history/:studentId',
    //   method: 'get',
    //   handler: controller.getStudentPaymentHistory,
    // },
    {
      path: '/queue',
      method: 'post',
      validations: [
        validate(schema.studentId),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.enqueuePaymentCreation,
    },
    {
      path: '/id/:id',
      method: 'delete',
      validations: [
        validate(schema.id, ValidationSource.PARAM),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.deletePayment,
    },
    // {
    //   path: '/id/:id',
    //   method: 'put',
    //   validations: [
    //     invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
    //     invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
    //   ],
    //   handler: controller.updatePayment,
    // },
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
      path: '/queues',
      method: 'post',
      validations: [
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
        invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT')),
      ],
      handler: controller.enqueueMultiplePayments,
    },
  ];
};

setRouter(router, getRouteMap());
export default router;
