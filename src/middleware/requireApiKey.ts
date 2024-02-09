import { ForbiddenError } from '@/lib/api';
import ApiKey, { Permission } from '@/modules/auth/apiKey/apiKey.model';
import { Request, Response, NextFunction } from 'express';


declare global {
  namespace Express {
    interface Request {
      apiKey: ApiKey;
    }
  }
}
export const requireApiKey = (req: Request, res: Response, next: NextFunction)=>{
      try {
        if (!req.apiKey?.permissions)
          return next(new ForbiddenError('Permission Denied'));

        const exists = req.apiKey.permissions.find(
          (entry) => entry === Permission.GENERAL || entry === Permission,
        );
        if (!exists) return next(new ForbiddenError('Permission Denied'));

        next();
      } catch (error) {
        next(error);
      }
}