import { Router } from 'express';
import users from '../modules/auth/users/user.routes';
import schoolRoutes from '@/routes/school.routes';
import { health } from './health';
import { authentication } from '@/middleware/authMiddleware';
import files from '@/modules/files/file.routes';
import NotifcationRoutes from '@/modules/notifications/notification.routes';
import socketRoues from '@/sockets/session.routes';
import invoices from '../modules/school/invoices/invoice.routes';
/* -----------------------------------------------------------------------------------*/
const router = Router();
/* -----------------------------------------------------------------------------------*/
/* -----------------------------------------------------------------------------------*/
router.get('/health', health);

/* -----------------------------------------------------------------------------------*/
router.use('/users', users);
/* -----------------------------------------------------------------------------------*/

/* -----------------------------------------------------------------------------------*/
router.use(authentication);
/* -----------------------------------------------------------------------------------*/
router.use('/files', files);
/* -----------------------------------------------------------------------------------*/
router.use('/school', schoolRoutes);
/* -----------------------------------------------------------------------------------*/
router.use('/notifications', NotifcationRoutes);
/* -----------------------------------------------------------------------------------*/
router.use('/sessions', socketRoues);
/* -----------------------------------------------------------------------------------*/
router.use('/invoices', invoices);

export default router;
