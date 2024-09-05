import { Router } from 'express';

import { ValidationSource, validate } from '@/lib/handlers/validate';

import * as controller from './event.controller';
import { RouteMap } from '@/types/routes';
import schema from './event.schema';
import { setRouter } from '@/lib/utils/utils';
import { invalidate } from '@/lib/handlers/cache.handler';
import { Key } from '@/data/cache/keys';

const router = Router();

const getRouteMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'post',
      validations: [schema.createEvent, invalidate(Key.Events)],
      handler: controller.addEvent,
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
      validations: [
        validate(schema.eventParams, ValidationSource.PARAM),
        invalidate(Key.Events),
      ],
    },
  ];
};

setRouter(router, getRouteMap());
export default router;
