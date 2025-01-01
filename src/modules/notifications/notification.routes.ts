import { Roles } from '@/lib/constants';
import { invalidateOnSuccess } from '@/lib/handlers/cache.handler';
import { validate } from '@/lib/handlers/validate';
import { setRouter } from '@/lib/utils/utils';
import attachRoles from '@/middleware/attachRoles';
import { authorize } from '@/middleware/authorize';
// import { validateRouteOrder } from '@/services/route-builder/routeBuilder';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './notification.controller';
import schema from './notification.schema';
import * as v1 from './v1/notification.controller';

const router = Router();

const getRouteMap = (): RouteMap[] => {
	return [
		{
			path: '/',
			method: 'get',
			handler: controller.getNotifications
		},
		{
			path: '/user',
			method: 'get',
			// handler: v1.getUserNotifications
			handler: v1.getUserNotifications
		},
		{
			path: '/:id',
			method: 'get',
			handler: controller.getNotificationById
		},

		{
			path: '/',
			method: 'post',
			validations: [
				attachRoles(Roles.ADMIN),
				validate(schema.create),
				authorize(Roles.ADMIN),
				invalidateOnSuccess(['notifications', '*'])
			],
			handler: controller.createNotification
		},
		{
			path: '/:id/read',
			method: 'put',
			validations: [
				schema.markAsDeleted,
				invalidateOnSuccess(['notifications', '*'])
			],
			handler: controller.markAsRead
		},
		{
			path: '/:id',
			method: 'get',
			handler: controller.checkIfRead
		},
		{
			path: '/:id',
			method: 'delete',
			validations: [attachRoles(Roles.ADMIN), authorize(Roles.ADMIN)],
			handler: controller.deleteNotification
		},
		{
			path: '/',
			method: 'delete',
			validations: [attachRoles(Roles.ADMIN), authorize(Roles.ADMIN)],
			handler: controller.deleteAllNotifications
		},
		{
			path: '/:id/delete',
			method: 'put',
			validations: [
				schema.markAsDeleted,
				invalidateOnSuccess(['notifications', '*'])
			],
			handler: controller.markAsDeleted
		}
	];
};

const routes = getRouteMap();
// validateRouteOrder(routes);
setRouter(router, routes);

export default router;
