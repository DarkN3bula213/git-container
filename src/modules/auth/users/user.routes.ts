import { Router } from 'express';
import * as controller from './user.controller';
import * as verfication from '../verification';
import { validate } from '@/lib/handlers/validate';
import schema, { insertMany, register } from './user.schema';
import verify from '../verification/verification.schema';
import type { RouteMap } from '@/types/routes';
import { setRouter } from '@/lib/utils/utils';

import { authentication } from '@/middleware/authMiddleware';
import attachRoles from '@/middleware/attachRoles';
import { Roles } from '@/lib/constants';
import { authorize } from '@/middleware/authorize';

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
            validations: [authentication, validate(schema.changePassword)],
            handler: controller.changePassword
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
            path: '/login',
            method: 'post',
            validations: [validate(schema.login)],
            handler: controller.login
        },
        {
            path: '/logout',
            method: 'post',
            validations: [authentication],
            handler: controller.logout
        },
        {
            path: '/currentUser',
            method: 'get',
            validations: [authentication],
            handler: controller.getCurrentUser
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
            // validations: [attachRoles(Roles.ADMIN), authentication],
        }
        // {
        //   path: '/status',
        //   method: 'get',
        //   handler: controller.isAdmin,
        //   validations: [
        //     attachRoles(Roles.ADMIN),
        //     authentication,
        //     authorize(Roles.ADMIN),
        //   ],
        // },
    ];
}

setRouter(router, getRouteMap());

export default router;
