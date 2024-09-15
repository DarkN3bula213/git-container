import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './stat.controller';
import schema from './stat.schema';
import { setRouter } from '@/lib/utils/utils';

const router = Router();

const getRoutes = (): RouteMap[] => {
    return [
        {
            path: '/global/:payId',
            method: 'get',
            validations: [schema.schoolStats],
            handler: controller.getSchoolStatsBySession
        }
    ];
};

setRouter(router, getRoutes());

export default router;
