import { Router } from 'express';
import * as controller from './user.controller';
import { validate } from '@/lib/handlers/validate';
import schema, { insertMany, register } from './user.schema';
import { Route, RouteMap } from '@/types/routes';
import { applyRoutes, setRouter } from '@/lib/utils/utils';
import { authenticate } from '@/middleware/authenticated';

const router = Router();

function getRouteMap(): RouteMap[] {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getUsers,
    },
    {
      path: '/seed',
      method: 'post',
      validations: [validate(insertMany)],
      handler: controller.insertMany,
    },
    {
      path: '/register',
      method: 'post',
      validations: [validate(register)],
      handler: controller.register,
    },
    {
      path: '/login',
      method: 'post',
      validations: [validate(schema.login)],
      handler: controller.login,
    },
    {
      path: '/currentUser',
      method: 'get',
      handler: controller.getCurrentUser,
      validations: [authenticate],
    },
  ];
}

setRouter(router, getRouteMap());

export default router;
