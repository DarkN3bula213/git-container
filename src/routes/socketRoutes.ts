import { setRouter } from '@/lib/utils/utils';
import { getSessionData } from '@/sockets/session.controller';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';

const router = Router();

const getRouteMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'get',
      handler:getSessionData,
    },
  ];
};

setRouter(router, getRouteMap());

export default router;
