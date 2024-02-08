import { Request, Router, Response } from 'express';
import users from '../modules/auth/users/user.routes'

const router = Router();
router.get('/', health);

router.use('/users', users);

async function health(req: Request, res: Response) {
  res.status(200).json({
    message: 'success',
  });
}

export default router;
