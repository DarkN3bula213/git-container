import * as controller from './issue.controller';
import { validate } from '@/lib/handlers/validate';

import { Route } from '@/types/routes';
import { applyRoutes } from '@/lib/utils/utils';
import { Router } from 'express';

const getRoutesMap = (): Route[] => {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getAllIssues,
    },
    {
      path: '/',
      method: 'post',
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
applyRoutes(router, getRoutesMap());

export default router;
