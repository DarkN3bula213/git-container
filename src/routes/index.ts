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
const Logger = new log(__filename);
const router = Router();
router.use(attachRoles(Roles.ADMIN),requireLogin);
router.use(useApiKey);
router.use('/school', schoolRoutes);
router.get('/', health);

router.use('/users', users);

router.use('/auth', auth);

// router.get('/power-user',requireLogin, allowUser , fullyAuthenticated);

async function health(req: Request, res: Response) {
  if (req.roles) {
    Logger.info(JSON.stringify(req.roles));
  }
  res.status(200).json({
    message: 'success',
  });
}

async function fullyAuthenticated(req: Request, res: Response) {
  res.json({
    message: 'success',
  });
}
export default router;
