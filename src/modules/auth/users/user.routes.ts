import { Router } from 'express';
import * as controller from './user.controller';
import { validate } from '@/lib/handlers/validate';
import schema, { insertMany, register } from './user.schema';
import { RouteMap } from '@/types/routes';
import { setRouter } from '@/lib/utils/utils';

import { authentication } from '@/middleware/authMiddleware';
import attachRoles from '@/middleware/attachRoles';
import { Roles } from '@/lib/constants';
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
      path: '/check-session',
      method: 'get',

      handler: controller.checkSession,
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
      path: '/aux',
      method: 'post',
      validations: [
        authentication,
        validate(schema.temporary),
        authorize(Roles.ADMIN),
      ],
      handler: controller.createTempUser,
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
      path: '/id/:id',
      method: 'get',
      handler: controller.getUserById,
      validations: [authentication],
    },

    {
      path: '/:id',
      method: 'delete',
      handler: controller.getUserById,
      validations: [attachRoles(Roles.ADMIN), authentication],
    },
    {
      path: '/status',
      method: 'get',
      handler: controller.isAdmin,
      validations: [
        attachRoles(Roles.ADMIN),
        authentication,
        authorize(Roles.ADMIN),
      ],
    },
  ];
}

setRouter(router, getRouteMap());

export default router;
