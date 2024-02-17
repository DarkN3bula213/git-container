import { Router } from 'express';

import * as controller from './student.controller';

import * as schema from './student.schema';

import { validate } from '@/lib/handlers/validate';
import { Route } from '@/types/routes';
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
  ];
}

applyRoutes(router, getRouteMap());

export default router;
