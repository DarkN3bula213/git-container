import { Router } from 'express';
import * as controller from './expense.controller';

import * as schema from './expense.schema';
import { validate } from '@/lib/handlers/validate';
import { RouteMap } from '@/types/routes';
import { setRouter } from '@/lib/utils/utils';

const router = Router();

function getRouteMap(): RouteMap[] {
   return [
      {
         path: '/',
         method: 'get',
         handler: controller.getExpenses
      },
      {
         path: '/:id',
         method: 'get',
         handler: controller.getExpenseById
      },
      {
         path: '/type/:type',
         method: 'get',
         handler: controller.getExpensesByType
      },
      {
         path: '/date/:date',
         method: 'get',
         handler: controller.getExpensesByDate
      },
      {
         path: '/',
         method: 'post',
         // validations: [validate(schema.createExpense)],
         // validations: [schema.createRequest],
         handler: controller.createExpense
      },
      {
         path: '/insertMany',
         method: 'post',
         // validations: [validate(schema.)],
         handler: controller.insertMUltipleExpenses
      },
      {
         path: '/:id',
         method: 'put',
         // validations: [validate(schema.updateExpense)],
         handler: controller.updateExpense
      },
      {
         path: '/:id',
         method: 'delete',
         handler: controller.deleteExpense
      },
      {
         path: '/reset',
         method: 'delete',
         handler: controller.resetCollection
      }
   ];
}

setRouter(router, getRouteMap());

export default router;
