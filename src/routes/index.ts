import { Request, Router, Response } from 'express';
import users from '../modules/auth/users/user.routes';
import { requireLogin } from '@/middleware/requireLogin';

const router = Router();

router.use(requireLogin)
router.get('/', health);

router.use('/users', users);

async function health(req: Request, res: Response) {
  res.status(200).json({
    message: 'success',
  });
}

export default router;
