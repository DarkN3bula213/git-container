import { setRouter } from '@/lib/utils/utils';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './subject.controller';
import schema from './subject.schema';

const router = Router();

const subjectRoutes = (): RouteMap[] => {
	return [
		{
			path: '/',
			method: 'get',
			handler: controller.getSubjects,
			validations: []
		},
		{
			path: '/:classId',
			method: 'get',
			handler: controller.getClassSubjects,
			validations: [schema.getClassSubjects]
		}
	];
};

setRouter(router, subjectRoutes());

export default router;
