import { Router } from 'express';
import * as controller from './user.controller';
import { validate } from '@/lib/handlers/validate';
import schema, { insertMany, register } from './user.schema';
import { Route, RouteMap } from '@/types/routes';
import { applyRoutes, setRouter } from '@/lib/utils/utils';

import { authentication } from '@/middleware/authMiddleware';
import attachRoles from '@/middleware/attachRoles';
import { Roles } from '@/lib/constants';

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
      path: '/logout',
      method: 'post',
      handler: controller.logout,
    },
    {
      path: '/currentUser',
      method: 'get',
      handler: controller.getCurrentUser,
      validations: [authentication],
    },
    {
      path: '/:id',
      method: 'get',
      handler: controller.getUserById,
      validations: [authentication],
    },
    
    {
      path: '/:id',
      method: 'delete',
      handler: controller.getUserById,
      validations: [attachRoles(Roles.ADMIN),authentication],
    },
    
  ];
}

setRouter(router, getRouteMap());

export default router;
