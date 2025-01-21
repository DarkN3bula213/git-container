import { authentication } from '@/middleware/authMiddleware';
import socketRoues from '@/modules/auth/sessions/session.routes';
import Conversations from '@/modules/conversations/conversation.routes';
import files from '@/modules/files/file.routes';
import NotifcationRoutes from '@/modules/notifications/notification.routes';
import schoolRoutes from '@/routes/school.routes';
import { Router } from 'express';
import settings from '../modules/auth/settings/settings.routes';
import users from '../modules/auth/users/user.routes';
import feedback from '../modules/feedback/feedback.routes';
import invoices from '../modules/school/invoices/invoice.routes';
import { health } from './health';

/* -----------------------------------------------------------------------------------*/
const router = Router();
/* -----------------------------------------------------------------------------------*/

router.get('/health', health);
/* -----------------------------------------------------------------------------------*/
router.use('/users', users);
/* -----------------------------------------------------------------------------------*/
router.use('/settings', settings);
/* -----------------------------------------------------------------------------------*/

router.use(authentication);

/* -----------------------------------------------------------------------------------*/
router.use('/files', files);
/* -----------------------------------------------------------------------------------*/
router.use('/feedback', feedback);
/* -----------------------------------------------------------------------------------*/
router.use('/school', schoolRoutes);
/* -----------------------------------------------------------------------------------*/
router.use('/notifications', NotifcationRoutes);
/* -----------------------------------------------------------------------------------*/
router.use('/sessions', socketRoues);
/* -----------------------------------------------------------------------------------*/
router.use('/invoices', invoices);
/* -----------------------------------------------------------------------------------*/
router.use('/conversations', Conversations);

export default router;
