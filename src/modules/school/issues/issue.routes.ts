import * as controller from './issue.controller';
import  schema from './issue.schema';


import { validate } from '@/lib/handlers/validate';

import {  RouteMap } from '@/types/routes';
import {  setRouter } from '@/lib/utils/utils';
import { Router } from 'express';
import { authenticate } from '@/middleware/authenticated';

const getRoutesMap = (): RouteMap[] => {
  return [
    {
      path: '/',
      method: 'get',
      validations: [authenticate],
      handler: controller.getAllIssues,
    },
    {
      path: '/',
      method: 'post',
      validations: [authenticate, validate(schema.createIssue)],
      handler: controller.createIssue,
    },
    {
      path: '/',
      method: 'delete',
      handler: controller.resetCollection,
    },
    {
      path: '/:_id',
      method: 'get',
      validations: [authenticate],
      handler: controller.getById,
    },
    // {
    //   path: '/:id',
    //   method: 'put',
    //   handler: controller.updateIssue,
    // },
    // {
    //   path: '/:id',
    //   method: 'delete',
    //   handler: controller.deleteIssue,
    // },
    // {
    //   path: '/:issueId/index/:replyIndex',
    //   method: 'delete',
    //   handler: controller.deleteUnreadReply,
    // },
  ];
};
const router = Router();
setRouter(router, getRoutesMap());

export default router;
