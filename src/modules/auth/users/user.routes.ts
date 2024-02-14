import { Router } from 'express';
import * as controller from './user.controller';
import { validate } from '@/lib/handlers/validate';
import schema, { insertMany, register } from './user.schema';
import { Route } from '@/types/routes';
import { applyRoutes } from '@/lib/utils/utils';

const router = Router();

 


function getRouteMap(): Route[] {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getUsers,
    },
    {
      path: '/seed',
      method: 'post',
      validation: validate(insertMany),
      handler: controller.insertMany,
    },
    {
      path: '/register',
      method: 'post',
      validation: validate(register),
      handler: controller.register,
    },
    {
      path: '/login',
      method: 'post',
      validation: validate(schema.login),
      handler: controller.login,
    },
    {
      path:'/currentUser',
      method: 'get',
      handler: controller.getCurrentUser
    }
  ];
}

applyRoutes(router, getRouteMap());

export default router;