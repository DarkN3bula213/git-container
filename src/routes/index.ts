import { Router } from 'express';
import users from '../modules/auth/users/user.routes';
import schoolRoutes from '@/modules/school/school.routes';
import { health } from './health';
import { authentication } from '@/middleware/authMiddleware';
import files from '@/modules/files/file.routes';
import NotifcationRoutes from '@/modules/notifications/notification.routes';

/* -----------------------------------------------------------------------------------*/
const router = Router();
/* -----------------------------------------------------------------------------------*/

/* -----------------------------------------------------------------------------------*/
router.use('/users', users);
/* -----------------------------------------------------------------------------------*/

/* -----------------------------------------------------------------------------------*/
router.use(authentication);
/* -----------------------------------------------------------------------------------*/
router.get('/', health);
/* -----------------------------------------------------------------------------------*/
router.use('/files', files);
/* -----------------------------------------------------------------------------------*/
router.use('/school', schoolRoutes);
/* -----------------------------------------------------------------------------------*/
router.use('/notifications', NotifcationRoutes);
/* -----------------------------------------------------------------------------------*/

export default router;
