import { Router} from 'express';
import users from '../modules/auth/users/user.routes';
import protectedRequest from './protected';
import schoolRoutes from '@/modules/school/school.routes';
import { health } from './health';
import { authentication } from '@/middleware/authMiddleware';
import { config } from '@/lib/config';
import files from '@/modules/files/file.routes';

const router = Router();


router.use('/users', users);

router.use(authentication);
 
router.get('/', health);
router.use('/files', files);
router.use('/school', schoolRoutes);



export default router;
