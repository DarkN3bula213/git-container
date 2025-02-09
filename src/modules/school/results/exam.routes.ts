import { setRouter } from '@/lib/utils/utils';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './exam.controller';

const router = Router();

const getRoutes = (): RouteMap[] => [
	/*<----------- GET ROUTES --------->*/
	{
		path: '/:studentId',
		method: 'get',
		handler: controller.getStudentResult
	},
	/*<----------- POST ROUTES --------->*/
	{
		path: '/',
		method: 'post',
		handler: controller.addStudentResult
	},
	/*<----------- DELETE ROUTES --------->*/
	{
		path: '/:studentId',
		method: 'delete',
		handler: controller.deleteStudentResult
	}
];

setRouter(router, getRoutes());

export default router;
