import { DynamicKey } from '@/data/cache/keys';
import { Roles } from '@/lib/constants';
import { invalidate } from '@/lib/handlers/cache.handler';
import { validate } from '@/lib/handlers/validate';
import { RouterMap, mapRouter, setRouter } from '@/lib/utils/utils';
import { authentication } from '@/middleware/authMiddleware';
import { authorize } from '@/middleware/authorize';
import { limitRequest } from '@/middleware/rateLimit.middleware';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as verfication from '../verification';
import verify from '../verification/verification.schema';
import * as controller from './user.controller';
import schema, { register, updateProfile } from './user.schema';

const router = Router();

function getRouteMap(): RouteMap[] {
	return [
		{
			path: '/',
			method: 'get',
			handler: controller.getUsers
		},
		// /*<!-- 1. Forgot Password  ---------------------------( Verification )->*/

		// {
		// 	path: '/forgot-password',
		// 	method: 'post',
		// 	validations: [verify.forgotPass],
		// 	handler: verfication.forgotPassword
		// },
		// /*<!-- 2. Reset Password  ---------------------------( Verification )->*/
		// {
		// 	path: '/reset-password/:token',
		// 	method: 'post',
		// 	validations: [verify.resetPass],
		// 	handler: verfication.resetPassword
		// },
		// /*<!-- 3. Verify Email  ---------------------------( Verification )->*/
		// {
		// 	path: '/verify-email',
		// 	method: 'post',
		// 	validations: [verify.verfify],
		// 	handler: verfication.verifyUser
		// },
		// /*<!-- 4. Resend Verification  -------------------( Verification )->*/
		// {
		// 	path: '/reissue-email',
		// 	method: 'post',
		// 	validations: [verify.reissueEmail],
		// 	handler: verfication.reissueEmailVerificationToken
		// },
		/*<!-- 5. Register  ---------------------------( x )->*/
		{
			path: '/register',
			method: 'post',
			validations: [validate(register), limitRequest],
			handler: controller.register
		},
		/*<!-- 6. Change Password  ---------------------------( x )->*/
		{
			path: '/change-password',
			method: 'post',
			// validations: [authentication, validate(schema.changePassword)],
			validations: [authentication],
			handler: controller.changePassword
		},
		/*<!-- 7. Update  ---------------------------( x )->*/
		{
			path: '/:id',
			method: 'patch',
			validations: [
				authentication,
				updateProfile,
				invalidate([DynamicKey.USER, '*'])
			],
			handler: controller.updateUser
		},
		// /*<!-- 8. Registered User Verification  ---------------------------( Verification )->*/
		// {
		// 	path: '/verify-user',
		// 	method: 'post',
		// 	validations: [validate(schema.registeredUserVerification)],
		// 	handler: verfication.registeredUserVerification
		// },
		{
			path: '/aux',
			method: 'post',
			validations: [
				authentication,
				validate(schema.temporary),
				authorize(Roles.ADMIN)
			],
			handler: controller.createTempUser
		},
		{
			path: '/approve/:userId',
			method: 'patch',
			validations: [authentication],
			handler: verfication.toggleApproval
		},

		{
			path: '/id/:id',
			method: 'get',
			handler: controller.getUserById,
			validations: [authentication]
		},

		{
			path: '/:id',
			method: 'delete',
			handler: controller.deleteUser
		}
	];
}

function authenticationRoutes(): RouterMap[] {
	return [
		{
			path: '/login',
			methods: {
				post: {
					handler: controller.login,
					validations: [validate(schema.login)]
				}
			}
		},
		{
			path: '/logout',
			methods: {
				post: {
					handler: controller.logout,
					validations: [authentication]
				}
			}
		},
		{
			path: '/currentUser',
			methods: {
				get: {
					handler: controller.getCurrentUser,
					validations: [authentication]
				}
			}
		},
		{
			path: '/check-availability',
			methods: {
				get: { handler: controller.checkAvailability }
			}
		}
	];
}

function verificationRoutes(): RouterMap[] {
	return [
		/*<!-- 1. Verify Email  ---------------------------( Verification )->*/
		{
			path: '/verify-email',
			methods: {
				post: {
					handler: verfication.verifyUser,
					validations: [verify.verfify]
				}
			}
		},
		/*<!-- 2. Forgot Password  ---------------------------( Verification )->*/
		{
			path: '/forgot-password',
			methods: {
				post: {
					handler: verfication.forgotPassword,
					validations: [verify.forgotPass]
				}
			}
		},
		/*<!-- 3. Reset Password  ---------------------------( Verification )->*/
		{
			path: '/reset-password/:token',
			methods: {
				post: {
					handler: verfication.resetPassword,
					validations: [verify.resetPass]
				}
			}
		},
		/*<!-- 4. Reissue Email Verification Token  --------( Verification )->*/
		{
			path: '/reissue-email',
			methods: {
				post: {
					handler: verfication.reissueEmailVerificationToken,
					validations: [verify.reissueEmail]
				}
			}
		},
		/*<!-- 5. Registered User Verification  -----------( Verification )->*/
		{
			path: '/verify-user',
			methods: {
				post: {
					handler: verfication.registeredUserVerification,
					validations: [validate(schema.registeredUserVerification)]
				}
			}
		},
		{
			path: '/reissue-token',
			methods: {
				post: {
					handler: verfication.reIssueToken,
					validations: [verify.reissueToken]
				}
			}
		}
	];
}

mapRouter(router, authenticationRoutes());
mapRouter(router, verificationRoutes());
setRouter(router, getRouteMap());

export default router;
