import * as controller from './student.controller';
import * as schema from './student.schema';
import { validate } from '@/lib/handlers/validate';
import { Route } from '@/types/routes';
import { Router } from 'express';
import { applyRoutes } from '@/lib/utils/utils';

const router = Router();

function getRouteMap(): Route[] {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getStudents,
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
      validation: validate(schema.register),
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
      handler: controller.patchStudent,
    },
    {
      path: '/seed',
      method: 'post',
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
