import * as controller from './linear.controller';
import { Router } from 'express';
import { setRouter } from '@/lib/utils/utils';
import schema from './linear.schema';
import { ValidationSource, validate } from '@/lib/handlers/validate';
import type { RouteMap } from '@/types/routes';

const router = Router();

const createRoutes = (): RouteMap[] => {
  return [
    /*----------  Subsection comment block  ----------*/

    {
      path: '/',
      method: 'post',
      validations: [validate(schema.createIssue)],
      handler: controller.createLinearIssue,
    },
    {
      path: '/reply/:issueId',
      method: 'post',
      // validations: [validate(schema.addReply)],
      handler: controller.addReply,
    },
    {
      path: '/',
      method: 'get',
      handler: controller.getAllLinearIssues,
    },
    {
      path: '/:id',
      method: 'patch',
      validations: [validate(schema.getById, ValidationSource.PARAM)],
      handler: controller.getLinearIssueById,
    },

    {
      path: '/status/:id',
      method: 'patch',
      // validations: [
      //   validate({
      //     [ValidationSource.PARAM]: schema.issueId,
      //     [ValidationSource.BODY]: schema.description
      //   })
      // ],
      handler: controller.changeIssueFields,
    },
    {
      path: '/update/:id',
      method: 'patch',
      // validations: [
      //   validate({
      //     [ValidationSource.PARAM]: schema.issueId,
      //     [ValidationSource.BODY]: schema.description
      //   })
      // ],
      handler: controller.updateLinearIssue,
    },
    /*----------  Delete Route  ----------*/
    {
      path: '/remove/:id',
      method: 'delete',
      validations: [validate(schema.getById, ValidationSource.PARAM)],
      handler: controller.deleteLinearIssue,
    },
    {
      path: '/reset',
      method: 'delete',

      handler: controller.resetLinearCollection,
    },
  ];
};

const routes = createRoutes();

setRouter(router, routes);

export default router;
