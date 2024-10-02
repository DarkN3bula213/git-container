import { ValidationSource, validate } from '@/lib/handlers/validate';
import { setRouter } from '@/lib/utils/utils';
import { authentication } from '@/middleware/authMiddleware';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './issue.controller';
import schema from './issue.schema';
import linearRoutes from './version.0.1.0/linear.routes';

const getRoutesMap = (): RouteMap[] => {
	return [
		{
			path: '/',
			method: 'post',
			validations: [schema.createIssue],
			handler: controller.createIssue
		},
		{
			path: '/',
			method: 'get',
			validations: [],
			handler: controller.getAllIssues
		}
	];
};
const router = Router();
router.use('/linear', linearRoutes);
setRouter(router, getRoutesMap());

export default router;
