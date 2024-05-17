import { validate } from '@/lib/handlers/validate';
import { setRouter } from '@/lib/utils/utils';
import type { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as auth from './auth.controller';
import * as controller from './user.controller';
import schema, { insertMany, register } from './user.schema';

import { Roles } from '@/lib/constants';
import attachRoles from '@/middleware/attachRoles';
import { authentication } from '@/middleware/authMiddleware';
import { authorize } from '@/middleware/authorize';

const router = Router();

function getRouteMap(): RouteMap[] {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getUsers,
    },
    {
      path: '/:id',
      method: 'get',
      handler: controller.getUserById,
      validations: [authentication],
    },
    {
      path: '/',
      method: 'post',
      validations: [validate(register)],
      handler: controller.register,
    },

    {
      path: '/bulk',
      method: 'post',
      validations: [validate(insertMany)],
      handler: controller.insertMany,
    },

    {
      path: '/temp',
      method: 'post',
      validations: [
        authentication,
        validate(schema.temporary),
        authorize(Roles.ADMIN),
      ],
      handler: controller.createTempUser,
    },
    {
      path: '/:id',
      method: 'put',
      validations: [authentication],
      handler: controller.updateUser,
    },
    {
      path: '/',
      method: 'delete',
      validations: [
        authentication,
        validate(schema.temporary),
        authorize(Roles.ADMIN),
      ],
      handler: controller.reset,
    },
    {
      path: '/:id',
      method: 'delete',
      validations: [authentication, authorize(Roles.ADMIN)],
      handler: controller.deleteUser,
    },
    //------------------------------------------
    {
      path: '/login',
      method: 'post',
      validations: [validate(schema.login)],
      handler: auth.login,
    },
    {
      path: '/logout',
      method: 'post',
      validations: [authentication],
      handler: auth.logout,
    },
    {
      path: '/currentUser',
      method: 'get',
      validations: [authentication],
      handler: auth.getCurrentUser,
    },
  ];
}

setRouter(router, getRouteMap());

export default router;
