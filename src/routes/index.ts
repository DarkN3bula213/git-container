import { Request, Router, Response } from 'express';
import users from '../modules/auth/users/user.routes';
import auth from '../modules/auth/auth.routes';
import { requireLogin } from '@/middleware/requireLogin';
import { requireApiKey } from '@/middleware/requireApiKey';
import useApiKey from '../modules/auth/apiKey/apiKey.route';

const router = Router();

router.use(useApiKey)
router.get('/', health);

router.use('/users', users);

router.use('/auth', auth);

async function health(req: Request, res: Response) {
  res.status(200).json({
    message: 'success',
  });
}

export default router;
