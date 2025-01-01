import { DynamicKey } from '@/data/cache/keys';
import { invalidate, invalidateOnSuccess } from '@/lib/handlers/cache.handler';
import { validate } from '@/lib/handlers/validate';
import { setRouter } from '@/lib/utils/utils';
import { type RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as aggregations from './controllers/aggregation.controller';
import * as promotionController from './controllers/promotion.controller';
import * as controller from './student.controller';
import * as schema from './student.schema';

const router = Router();
router.route('/sorted').get(aggregations.fetchStudentsWithPaidStatus);
router
	.route('/update-fee')
	.put(
		validate(schema.updateFee),
		invalidate([DynamicKey.STUDENTS, '*']),
		controller.updateStudentFees
	);

router
	.route('/update-section')
	.put(
		validate(schema.updateSection),
		invalidate([DynamicKey.STUDENTS, '*']),
		controller.changeStudentSection
	);

function getPromotionRouteMap(): RouteMap[] {
	return [
		{
			path: '/promote',
			method: 'post',
			validations: [
				validate(schema.promote),
				invalidateOnSuccess([DynamicKey.STUDENTS, '*'])
			],
			handler: promotionController.promoteStudents
		},
		{
			path: '/rollback',
			method: 'post',
			validations: [
				validate(schema.rollback),
				invalidateOnSuccess([DynamicKey.STUDENTS, '*'])
			],
			handler: promotionController.rollbackPromotion
		}
	];
}
function getRouteMap(): RouteMap[] {
	return [
		{
			path: '/',
			method: 'get',
			handler: controller.getStudents
		},
		{
			path: '/',
			method: 'post',
			validations: [
				validate(schema.register),
				invalidate(DynamicKey.STUDENTS)
			],
			handler: controller.newAdmission
		},
		/*-------------{Payments Aggregations}---------------*/
		{
			path: '/with-payments',
			method: 'get',
			handler: controller.getStudentsWithPayments
		},
		{
			path: '/payments/:id',
			method: 'get',
			handler: controller.studentFeeAggregated
		},
		{
			path: '/monthly-aggregated',
			method: 'get',
			handler: aggregations.monthlyAggregatedStudentsController
		},
		{
			path: '/fee-documents/:id',
			method: 'get',
			validations: [schema.student],
			handler: aggregations.getStudentsWithFeeDocuments
		},
		/*--------------------------------------------------*/
		// {
		// 	path: '/sortedByClassName',
		// 	method: 'get',
		// 	handler: controller.sortedByClassName
		// },

		{
			path: '/class/:classId',
			method: 'get',
			handler: controller.getStudentByClass
		},

		{
			path: '/:id',
			method: 'get',
			handler: controller.getStudentsById
		},
		{
			path: '/:id',
			method: 'patch',
			validations: [invalidate(DynamicKey.STUDENTS)],
			handler: controller.patchStudent
		},

		{
			path: '/:id',
			method: 'delete',
			handler: controller.removeStudent
		}
	];
}

setRouter(router, getRouteMap());
setRouter(router, getPromotionRouteMap());

export default router;
