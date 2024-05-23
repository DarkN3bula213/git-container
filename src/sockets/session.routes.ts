import { Roles } from '@/lib/constants';
import { setRouter } from '@/lib/utils/utils';
import { authorize } from '@/middleware/authorize';
import type { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './session.controller';
const router = Router();

const getRouteMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getAggregateSessions,
    },
    {
      path: '/:id',
      method: 'get',
      handler: controller.getSessionById,
    },
    {
      path: '/User/:id',
      method: 'get',
      handler: controller.getSessionsByUserId,
    },
    {
      path: '/',
      method: 'delete',
      validations: [authorize(Roles.ADMIN)],
      handler: controller.deleteAllSessions,
    },
    {
      path: '/:id',
      method: 'delete',
      validations: [authorize(Roles.ADMIN)],
      handler: controller.deleteSession,
    },
  ];
};
setRouter(router, getRouteMap());

export default router;
