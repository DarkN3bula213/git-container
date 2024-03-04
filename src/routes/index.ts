import { Request, Router, Response } from 'express';
import users from '../modules/auth/users/user.routes';

import protectedRequest from './protected';
// import { requireLogin } from '@/middleware/requireLogin';
import useApiKey from '../modules/auth/apiKey/apiKey.route';
import attachRoles from '@/middleware/attachRoles';
import { Roles } from '@/lib/constants';
import { Logger as log } from '@/lib/logger';

import schoolRoutes from '@/modules/school/school.routes';
import { health } from './health';
import { authentication } from '@/middleware/authMiddleware';
const Logger = new log(__filename);
const router = Router();


router.use('/users', users);
router.use(authentication);
router.get('/', health);
router.use('/school', schoolRoutes);
router.use('/protected', protectedRequest);
router.use(attachRoles(Roles.ADMIN));

export default router;
