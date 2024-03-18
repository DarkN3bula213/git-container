import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './notification.controller';
import { setRouter } from '@/lib/utils/utils';
import { authorize } from '@/middleware/authorize';
import { Roles } from '@/lib/constants';
import schema from './notification.schema';
import { validate } from '@/lib/handlers/validate';
import attachRoles from '@/middleware/attachRoles';
const router = Router();

const getRouteMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getNotifications,
    },
    {
      path: '/:id',
      method: 'get',
      handler: controller.getNotificationById,
    },
    {
      path: '/',
      method: 'post',
      validations: [
        attachRoles(Roles.ADMIN),
        validate(schema.create),
        authorize(Roles.ADMIN),
      ],
      handler: controller.createNotification,
    },
    {
      path: '/:id',
      method: 'put',
      handler: controller.markAsRead,
    },
    {
      path: '/:id',
      method: 'get',
      handler: controller.checkIfRead,
    },
    {
      path: '/:id',
      method: 'delete',
      validations: [attachRoles(Roles.ADMIN), authorize(Roles.ADMIN)],
      handler: controller.deleteNotification,
    },
    {
      path: '/',
      method: 'delete',
      validations: [attachRoles(Roles.ADMIN), authorize(Roles.ADMIN)],
      handler: controller.deleteAllNotifications,
    },
  ];
};

setRouter(router, getRouteMap());

export default router;
