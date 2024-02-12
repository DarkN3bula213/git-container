import { Request, Router, Response } from 'express';
import users from '../modules/auth/users/user.routes';
import auth from '../modules/auth/auth.routes';
import { requireLogin } from '@/middleware/requireLogin';
import useApiKey from '../modules/auth/apiKey/apiKey.route';
import attachRoles from '@/middleware/attachRoles';
import { Roles } from '@/lib/constants';
import { Logger as log } from '@/lib/logger';
import { allowUser } from '@/middleware/authenticated';
import schoolRoutes from '@/modules/school/school.routes';
import { health } from './health';
const Logger = new log(__filename);
const router = Router();
router.use(useApiKey);
 

router.get('/', health);


router.use('/school', schoolRoutes);

router.use('/users', users);

router.use('/auth', auth);
router.use(attachRoles(Roles.ADMIN), requireLogin, allowUser);



 
export default router;
