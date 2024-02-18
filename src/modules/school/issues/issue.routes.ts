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
      handler: controller.getAllIssues,
    },
    {
      path: '/',
      method: 'post',
      validations:[authenticate,validate(schema.createIssue)],
      handler: controller.createIssue,
    },
    {
      path: '/:id',
      method: 'get',
      handler: controller.getIssueById,
    },
    {
      path: '/:id',
      method: 'put',
      handler: controller.updateIssue,
    },
    {
      path: '/:id',
      method: 'delete',
      handler: controller.deleteIssue,
    },
    {
      path: '/:issueId/index/:replyIndex',
      method: 'delete',
      handler: controller.deleteUnreadReply,
    },
  ];
};
const router = Router();
setRouter(router, getRoutesMap());

export default router;
