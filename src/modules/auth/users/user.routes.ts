import { Roles } from '@/lib/constants';
import { validate } from '@/lib/handlers/validate';
import { RouterMap, mapRouter, setRouter } from '@/lib/utils/utils';
import { authentication } from '@/middleware/authMiddleware';
import { authorize } from '@/middleware/authorize';
import type { RouteMap } from '@/types/routes';
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
		/*<!-- 1. Forgot Password  ---------------------------( x )->*/

		{
			path: '/forgot-password',
			method: 'post',
			validations: [verify.forgotPass],
			handler: verfication.forgotPassword
		},
		/*<!-- 2. Reset Password  ---------------------------( x )->*/
		{
			path: '/reset-password/:token',
			method: 'post',
			validations: [verify.resetPass],
			handler: verfication.resetPassword
		},
		/*<!-- 3. Verify Email  ---------------------------( x )->*/
		{
			path: '/verify-email',
			method: 'post',
			validations: [verify.verfify],
			handler: verfication.verifyUser
		},
		/*<!-- 4. Resend Verification  ---------------------------( x )->*/
		{
			path: '/reissue-email',
			method: 'post',
			validations: [verify.reissueEmail],
			handler: verfication.reissueEmailVerificationToken
		},
		/*<!-- 5. Register  ---------------------------( x )->*/
		{
			path: '/register',
			method: 'post',
			validations: [validate(register)],
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
			validations: [authentication, updateProfile],
			handler: controller.updateUser
		},
		/*<!-- 8. Registered User Verification  ---------------------------( x )->*/
		{
			path: '/verify-user',
			method: 'post',
			validations: [validate(schema.registeredUserVerification)],
			handler: verfication.registeredUserVerification
		},
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
		}
	];
}

mapRouter(router, authenticationRoutes());
// mapRouter(router, verificationRoutes());
setRouter(router, getRouteMap());

export default router;
