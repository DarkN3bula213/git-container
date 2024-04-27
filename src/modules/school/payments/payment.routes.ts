import { Router } from 'express';
import * as controller from './payment.controller';
import { RouteMap } from '@/types/routes';
import attachRoles from '@/middleware/attachRoles';
import { Roles } from '@/lib/constants';
import { authorize } from '@/middleware/authorize';
import { setRouter } from '@/lib/utils/utils';
import { invalidate } from '@/lib/handlers/cacha.handler';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import schema from './payment.schema';
import { validate } from '@/lib/handlers/validate';

const router = Router();

const getRouteMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'post',
      validations: [invalidate(getDynamicKey(DynamicKey.FEE, 'all'))],
      handler: controller.createPayment,
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
      path: '/student/:studentId',
      method: 'get',
      handler: controller.getPaymentsByStudentId,
    },
    {
      path: '/class/:className',
      method: 'get',
      handler: controller.getStudentPaymentsByClass,
    },
    {
      path: '/payid/:payId',
      method: 'get',
      handler: controller.getMonthsPayments,
    },
    {
      path: '/id/:id',
      method: 'delete',
      validations: [invalidate(getDynamicKey(DynamicKey.FEE, 'all'))],
      handler: controller.deletePayment,
    },
    {
      path: '/id/:id',
      method: 'put',
      validations: [invalidate(getDynamicKey(DynamicKey.FEE, 'all'))],
      handler: controller.updatePayment,
    },
    {
      path: '/reset',
      method: 'delete',
      validations: [
        attachRoles(Roles.ADMIN),
        authorize(Roles.ADMIN),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
      ],
      handler: controller.resetCollection,
    },
    {
      path: '/queue',
      method: 'post',
      validations: [invalidate(getDynamicKey(DynamicKey.FEE, 'all'))],
      handler: controller.enqueuePaymentCreation,
    },
    {
      path: '/queues',
      method: 'post',
      validations: [invalidate(getDynamicKey(DynamicKey.FEE, 'all'))],
      handler: controller.enqueueMultiplePayments,
    },
    {
      path: '/batch',
      method: 'post',
      validations: [
        validate(schema.batchPayments),
        invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
      ],
      handler: controller.handleBatchPayments,
    },
  ];
};

setRouter(router, getRouteMap());
export default router;
