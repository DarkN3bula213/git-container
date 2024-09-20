import { authentication } from '@/middleware/authMiddleware';
import socketRoues from '@/modules/auth/sessions/session.routes';
import files from '@/modules/files/file.routes';
import NotifcationRoutes from '@/modules/notifications/notification.routes';
import schoolRoutes from '@/routes/school.routes';

import { Router } from 'express';

import users from '../modules/auth/users/user.routes';
import invoices from '../modules/school/invoices/invoice.routes';
import { health } from './health';

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
