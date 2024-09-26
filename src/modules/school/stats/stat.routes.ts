import { setRouter } from '@/lib/utils/utils';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './stat.controller';
import schema from './stat.schema';

const router = Router();

const getRoutes = (): RouteMap[] => {
	return [
		{
			path: '/global/:payId',
			method: 'get',
			validations: [schema.schoolStats],
			handler: controller.getSchoolStatsBySession
		},
		{
			path: '/students/:payId',
			method: 'get',
			validations: [schema.schoolStats],
			handler: controller.getUnpaidStudentsList
		},
		{
			path: '/collection',
			method: 'get',
			handler: controller.getTodaysCollection
		}
	];
};

setRouter(router, getRoutes());

export default router;
