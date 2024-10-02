import { registerRoutes, Routes, setRouter } from '@/lib/utils/utils';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './stat.controller';
import schema from './stat.schema';

const router = Router();


const routes = (): Routes => [
	{
		path: '/global/:payId',
		methods: ['GET'],
		handlers: [controller.getSchoolStatsBySession],
		validations: [schema.schoolStats],
	},
	{
		path: '/students/:payId',
		methods: ['GET'],
		handlers: [controller.getUnpaidStudentsList],
		validations: [schema.schoolStats]
	},
	{
		path: '/collection',
		methods: ['GET'],
		handlers: [controller.getTodaysCollection]
	}
];

// setRouter(router, getRoutes());
registerRoutes(router, routes());

export default router;
