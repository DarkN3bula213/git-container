import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { Roles } from '@/lib/constants';
import { invalidate } from '@/lib/handlers/cache.handler';
import { validate } from '@/lib/handlers/validate';
import { setRouter } from '@/lib/utils/utils';
import attachRoles from '@/middleware/attachRoles';
import { authorize } from '@/middleware/authorize';
import type { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './payment.controller';
import schema from './payment.schema';

const router = Router();

router.route('/history/:studentId').get(controller.getStudentPaymentHistory);

const getRouteMap = (): RouteMap[] => {
	return [
		/*<!-- 1. Get  ---------------------------( Get Billing Cycle )->*/
		{
			path: '/cycles',
			method: 'get',
			handler: controller.getAvailableBillingCycles
		},

		/*<!-- 1. Get  ---------------------------( Get by PayID )->*/
		{
			path: '/bill-cycle/:billingCycle',
			method: 'get',
			validations: [schema.billingCycle],
			handler: controller.getFeesByCycle
		},
		/*<!-- 1. Get  ---------------------------( Get by Schools )->*/
		{
			path: '/stat/:payId',
			method: 'get',
			validations: [schema.schoolStats],
			handler: controller.getSchoolStatsBySession
		},
		{
			path: '/',
			method: 'post',
			validations: [
				invalidate(getDynamicKey(DynamicKey.FEE, '*')),
				invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT'))
			],
			handler: controller.createPayment
		},
		{
			path: '/transaction',
			method: 'post',
			validations: [
				validate(schema.transactions),
				invalidate([
					getDynamicKey(DynamicKey.FEE, '*'),
					getDynamicKey(DynamicKey.STUDENTS, '*')
				])
			],
			handler: controller.commitTransaction
		},
		{
			path: '/transaction',
			method: 'put',
			validations: [
				validate(schema.transactions),
				invalidate([
					getDynamicKey(DynamicKey.FEE, '*'),
					getDynamicKey(DynamicKey.STUDENTS, '*')
				])
			],
			handler: controller.deleteCommittedTransactions
		},
		{
			path: '/student/:studentId',
			method: 'get',
			handler: controller.getPaymentsByStudentId
		},
		{
			path: '/stats',
			method: 'get',

			handler: controller.getSchoolStats
		},
		{
			path: '/custom',
			method: 'post',
			validations: [invalidate(getDynamicKey(DynamicKey.FEE, 'all'))],
			handler: controller.makeCustomPayment
		},
		{
			path: '/multi-insert',
			method: 'post',
			validations: [
				validate(schema.createPaymentsBulk),
				invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
				invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT'))
			],
			handler: controller.createPaymentsBulk
		},
		{
			path: '/',
			method: 'get',
			handler: controller.getPayments
		},
		{
			path: '/id/:id',
			method: 'get',
			handler: controller.getPaymentById
		},
		{
			path: '/stats',
			method: 'get',
			handler: controller.getPaymentById
		},
		{
			path: '/stats/id/:id',
			method: 'get',
			validations: [validate(schema.payId)],
			handler: controller.getPaymentById
		},
		{
			path: '/class/:className',
			method: 'get',
			handler: controller.getStudentPaymentsByClass
		},
		{
			path: '/payId/:payId',
			method: 'get',
			handler: controller.getMonthsPayments
		},
		{
			path: '/id/:id',
			method: 'delete',
			validations: [
				invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
				invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT'))
			],
			handler: controller.deletePayment
		},
		{
			path: '/id/:id',
			method: 'put',
			validations: [
				invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
				invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT'))
			],
			handler: controller.updatePayment
		},
		{
			path: '/reset',
			method: 'delete',
			validations: [
				attachRoles(Roles.ADMIN),
				authorize(Roles.ADMIN),
				invalidate(getDynamicKey(DynamicKey.FEE, 'all')),
				invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT'))
			],
			handler: controller.resetCollection
		},
		{
			path: '/delete',
			method: 'delete',
			validations: [
				validate(schema.removeBulk),
				invalidate(getDynamicKey(DynamicKey.FEE, '*')),
				invalidate(getDynamicKey(DynamicKey.FEE, 'STATCURRENT'))
			],
			handler: controller.deleteManyByID
		}
	];
};

setRouter(router, getRouteMap());

export default router;
