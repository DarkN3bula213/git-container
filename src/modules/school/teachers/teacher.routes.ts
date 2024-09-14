import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './teacher.controller';
import { validate } from '@/lib/handlers/validate';
import * as schema from './teacher.schema';
import { setRouter } from '@/lib/utils/utils';
import { authorize } from '@/middleware/authorize';
import { Roles } from '@/lib/constants';
const router = Router();

function getRouteMap(): RouteMap[] {
   return [
      {
         path: '/',
         method: 'get',
         handler: controller.getTeachersSorted
      },
      {
         path: '/:id',
         method: 'get',
         handler: controller.getTeacherById
      },
      {
         path: '/',
         method: 'post',
         handler: controller.createTeacher,
         validations: [validate(schema.teacherSchema)]
      },
      {
         path: '/multiple',
         method: 'post',
         handler: controller.createManyTeachers
      },
      {
         path: '/:id',
         method: 'put',
         handler: controller.updateTeacherById
      },

      {
         path: '/reset',
         method: 'delete',
         // validations: [authorize(Roles.ADMIN)],
         handler: controller.resetTeachers
      }
   ];
}

setRouter(router, getRouteMap());

export default router;
