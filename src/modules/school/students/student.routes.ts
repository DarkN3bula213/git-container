import * as controller from './student.controller';
import * as schema from './student.schema';
import { validate } from '@/lib/handlers/validate';
import { Route, type RouteMap } from '@/types/routes';
import { Router } from 'express';
import { invalidate } from '@/lib/handlers/cache.handler';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { setRouter } from '@/lib/utils/utils';
import { Roles } from '@/lib/constants';
import attachRoles from '@/middleware/attachRoles';
import { authorize } from '@/middleware/authorize';

const router = Router();
router.route('/sorted').get(controller.rootFetch);
router
  .route('/update-fee')
  .put(
    validate(schema.updateFee),
    invalidate(DynamicKey.STUDENTS),
    controller.updateStudentFees,
  );

router
  .route('/update-section')
  .put(
    validate(schema.updateSection),
    invalidate(DynamicKey.STUDENTS),
    controller.changeStudentSection,
  );
function getRouteMap(): RouteMap[] {
  return [
    {
      path: '/',
      method: 'get',
      handler: controller.getStudents,
    },
    {
      path: '/',
      method: 'post',
      validations: [validate(schema.register), invalidate(DynamicKey.STUDENTS)],
      handler: controller.newAdmission,
    },
    {
      path: '/with-payments',
      method: 'get',
      handler: controller.getStudentsWithPayments,
    },
    {
      path: '/sortedByClassName',
      method: 'get',
      handler: controller.sortedByClassName,
    },
    {
      path: '/payments/:id',
      method: 'get',
      handler: controller.studentFeeAggregated,
    },
    {
      path: '/class/:classId',
      method: 'get',
      handler: controller.getStudentByClass,
    },

    {
      path: '/:id',
      method: 'get',
      handler: controller.getStudentsById,
    },
    {
      path: '/:id',
      method: 'patch',
      validations: [invalidate(DynamicKey.STUDENTS)],
      handler: controller.patchStudent,
    },

    {
      path: '/:id',
      method: 'delete',
      handler: controller.removeStudent,
    },
  ];
}

setRouter(router, getRouteMap());

export default router;
