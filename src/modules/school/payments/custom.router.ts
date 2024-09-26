import { ValidationSource, validate } from '@/lib/handlers/validate';
import { setRouter } from '@/lib/utils/utils';
import type { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './payment.controller';
import schema from './payment.schema';

const router = Router();

const getRouteMap = (): RouteMap[] => {
	return [
		{
			path: '/',
			method: 'get',
			handler: controller.customSorting
		},
		{
			path: '/id/:studentId',
			method: 'get',
			validations: [validate(schema.studentId, ValidationSource.PARAM)],
			handler: controller.getStudentPaymentHistory
		}
	];
};

setRouter(router, getRouteMap());
export default router;
