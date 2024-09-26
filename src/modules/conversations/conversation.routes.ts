import { setRouter } from '@/lib/utils/utils';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './conversation.controller';
import schema from './conversation.schema';

const router = Router();

const getRoutes = (): RouteMap[] => [
	{
		path: '/:id',
		method: 'delete',
		validations: [schema.deleteMessage],
		handler: controller.deleteMessage
	}
];

setRouter(router, getRoutes());

export default router;
