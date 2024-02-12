import { AuthFailureError } from '@/lib/api';
import { Logger as l } from '@/lib/logger';
import { User } from '@/modules/auth/users/user.model';
import { Request, Response, NextFunction, Router } from 'express';
import { loggers } from 'winston';
const Logger = new l(__filename);
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

export const allowUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || !req.roles) {
    Logger.warn('User not authenticated');
    return next();
  } else if ((req.user as User).role == req.roles) {
    Logger.info({
      user:'Authenticated',
      requireRole:`${req.roles}`,
      userRole:`${(req.user as User).role}`
    });
    return next();
  }

  Logger.error('User not allowed');
  next();
};

const router = Router();

router.use(isAuthenticated);
router.use(allowUser);
export default router;
