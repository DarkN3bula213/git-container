import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controllers from './invoice.controller';
import schema from './invoice.schema';
import { setRouter } from '@/lib/utils/utils';

const router = Router();

const routes = (): RouteMap[] => [
   {
      path: '/generate',
      method: 'post',
      validations: [schema.getInvoice],
      handler: controllers.generateInvoice
   }
];

setRouter(router, routes());

export default router;
