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
         method: 'get',
         handler: controller.customSorting
      },
      {
         path: '/id/:studentId',
         method: 'get',
         validations: [validate(schema.studentId, ValidationSource.PARAM)],
         handler: controller.getStudentPaymentHistory
      }
   ];
};

setRouter(router, getRouteMap());
export default router;
