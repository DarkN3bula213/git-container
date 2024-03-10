import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './teacher.controller';
import { ValidationSource, validate } from '@/lib/handlers/validate';
import * as schema from './teacher.schema';
import { setRouter } from '@/lib/utils/utils';
const router = Router();

function getRouteMap(): RouteMap[] {
  return [
    {
      path: '/',
      method: 'post',
      //   validations: [validate(schema.teacherSchema)], // Assuming this is for creating a new teacher
      handler: controller.createTeacher,
    },
    {
      path: '/:id',
      method: 'get',
      // validations: [
      //   validate(schema.fetchTeacherParamsSchema, ValidationSource.PARAM),
      // ],
      handler: controller.getTeacherById,
    },
    { 
      path: '/',
      method: 'get',
      handler: controller.getTeachersSorted, // No specific validations needed for sorting
    },
    {
      path: '/:id',
      method: 'put',
      //   validations: [ ],
      handler: controller.updateTeacherById,
    },
    {
      path: '/seed',
      method: 'post',
      //   validations: [validate(Joi.array().items(teacherSchema))], // For inserting many teachers
      handler: controller.insertManyTeachers,
    },
    {
      path: '/reset',
      method: 'delete',
      handler: controller.resetTeachers, // No validations needed for resetting
    },
    {
      path: '/teachers/:id',
      method: 'delete',
      validations: [
        validate(schema.updateTeacherParamsSchema, ValidationSource.PARAM),
      ],
      handler: controller.deleteTeacherById,
    },

    // Additional routes for fetching by CNIC, updating by CNIC can follow a similar pattern
    // Make sure to define and use appropriate validations schemas for those specific cases
  ];
}

setRouter(router, getRouteMap());

export default router;
