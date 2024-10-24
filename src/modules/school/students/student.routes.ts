import * as controller from './student.controller';
import * as schema from './student.schema';
import { validate } from '@/lib/handlers/validate';
import { Route, RouteMap } from '@/types/routes';
import { Router } from 'express';
import { applyRoutes } from '@/lib/utils/utils';
import { invalidate } from '@/lib/handlers/cache.handler';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';

const router = Router();

function getRouteMap(): RouteMap[] {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getStudents,
    },
    {
      path: '/sorted',
      method: 'get',
      handler: controller.customSorting,
    },
    {
      path: '/payments/:id',
      method: 'get',
      handler: controller.studentFeeAggregated,
    },
    {
      path: '/class/:classId',
      method: 'get',
      handler: controller.getStudentByClass,
    },
    {
      path: '/',
      method: 'post',
      validations: [
        validate(schema.register),
        invalidate(getDynamicKey(DynamicKey.STUDENTS, 'sorted')),
      ],
      handler: controller.newAdmission,
    },
    {
      path: '/:id',
      method: 'get',
      handler: controller.getStudentsById,
    },
    {
      path: '/:id',
      method: 'patch',
      validations: [invalidate(getDynamicKey(DynamicKey.STUDENTS, 'sorted'))],
      handler: controller.patchStudent,
    },
    {
      path: '/seed',
      method: 'post',
      validations: [invalidate(getDynamicKey(DynamicKey.STUDENTS, 'sorted'))],
      handler: controller.bulkPost,
    },
    {
      path: '/sortedByClassName',
      method: 'get',
      handler: controller.sortedByClassName,
    },
    {
      path: '/reset',
      method: 'delete',
      validations: [invalidate(getDynamicKey(DynamicKey.STUDENTS, 'sorted'))],
      handler: controller.resetCollection,
    },

    {
      path: '/:id',
      method: 'delete',
      handler: controller.removeStudent,
    },
  ];
}

applyRoutes(router, getRouteMap());

export default router;
