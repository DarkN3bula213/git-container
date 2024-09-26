import { DynamicKey } from '@/data/cache/keys';
import { invalidate } from '@/lib/handlers/cache.handler';
import { validate } from '@/lib/handlers/validate';
import { setRouter } from '@/lib/utils/utils';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './class.controller';
import * as schema from './class.schema';

const router = Router();

router
	.route('/')
	.get(controller.findClasses)
	.post(validate(schema.singleClass), controller.addClass)
	.delete(controller.deleteAll);

router
	.route('/:id')
	.get(controller.findClassById)
	.put(validate(schema.singleClass), controller.updateClass)
	.delete(controller.deleteClass);

router.get('/name/:name', controller.findClassByName);

router.put('/fee/:name', validate(schema.fee), controller.updateClassFee);

router.post('/seed', validate(schema.multiClass), controller.insertMany);

const routes = (): RouteMap[] => {
	return [
		/*<----------------------------------------(NEW ROUTES) */

		{
			path: '/subject/:classId',
			method: 'post',
			validations: [invalidate(DynamicKey.CLASS)],
			handler: controller.addSubjectToClass
		},
		{
			path: '/subject/:classId',
			method: 'put',
			validations: [invalidate(DynamicKey.CLASS)],
			handler: controller.removeSubjectFromClass
		},
		{
			path: '/teacher/:classId',
			method: 'post',
			validations: [invalidate(DynamicKey.CLASS)],
			handler: controller.addClassTeacher
		}
	];
};

setRouter(router, routes());

export default router;
