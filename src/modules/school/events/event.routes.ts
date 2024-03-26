import { Router } from 'express';

import { ValidationSource, validate } from '@/lib/handlers/validate';

import * as controller from './event.controller';
import { RouteMap } from '@/types/routes';
import schema from './event.schema';
import { setRouter } from '@/lib/utils/utils';

const router = Router();

const getRouteMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'post',
      handler: controller.addEvent,
      validations: [validate(schema.addEvent)],
    },
    {
      path: '/:id',
      method: 'get',
      handler: controller.fetchEvent,
      validations: [validate(schema.eventParams, ValidationSource.PARAM)],
    },
    {
      path: '/',
      method: 'get',
      handler: controller.fetchAllEvents,
    },
    {
      path: '/:id',
      method: 'put',
      handler: controller.updateEvent,
      validations: [validate(schema.eventParams, ValidationSource.PARAM)],
    },
    {
      path: '/:id',
      method: 'delete',
      handler: controller.deleteEvent,
      validations: [validate(schema.eventParams, ValidationSource.PARAM)],
    },
  ];
};

setRouter(router, getRouteMap());
export default router;
