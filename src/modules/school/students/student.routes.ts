import { Router } from 'express';

import * as controller from './student.controller';

import * as schema from './student.schema';

import { validate } from '@/lib/handlers/validate';
import { Route } from '@/types/routes';
import { applyRoutes } from '@/lib/utils/utils';

const router = Router();

// router.route('/').get(controller.getStudents).post(controller.createStudent);
// router.route('/:id').get(controller.getStudentsById);
// router.route('/seed').post(controller.bulkPost);
// router.route('/sortedByClassName').get(controller.sortedByClassName);


function getRouteMap(): Route[] {
    return [
        {
            path: '/',
            method: 'get',
            handler: controller.getStudents,
        },
        {
            path: '/',
            method: 'post',
            validation: validate(schema.register),
            handler: controller.newAdmission,
        },
        {
            path: '/:id',
            method: 'get',
            handler: controller.getStudentsById,
        },
        {
            path: '/seed',
            method: 'post',
            handler: controller.bulkPost,
        },
        {
            path: '/sortedByClassName',
            method: 'get',
            handler: controller.sortedByClassName,
        },
    ];
}

applyRoutes(router, getRouteMap());

export default router;