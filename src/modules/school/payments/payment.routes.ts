import { Router } from 'express';
import * as controller from './payment.controller';
import { RouteMap } from '@/types/routes';
import schema from './payment.schema';
import { validate } from '@/lib/handlers/validate';
import attachRoles from '@/middleware/attachRoles';
import { Roles } from '@/lib/constants';
import { authorize } from '@/middleware/authorize';
import { setRouter } from '@/lib/utils/utils';

const router = Router();

const getRouteMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'post',
      validations: [validate(schema.createPayment)],
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
      path: '/class/:classId',
      method: 'get',
      handler: controller.getPaymentsByClassId,
    },
    {
      path: '/payid/:payId',
      method: 'get',
      handler: controller.getPaymentByPayId,
    },
    {
      path: '/id/:id',
      method: 'delete',
      handler: controller.deletePayment,
    },
    {
      path: '/id/:id',
      method: 'put',
      handler: controller.updatePayment,
    },
    {
      path: '/reset',
      method: 'delete',
      validations: [attachRoles(Roles.ADMIN), authorize(Roles.ADMIN)],
      handler: controller.resetCollection,
    },
  ];
};


setRouter(router, getRouteMap());
export default router;
