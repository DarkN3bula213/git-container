import { Roles } from '@/lib/constants';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    export interface Request {
      roles: string;
    }
  }
}
export default (roleCodes: Roles) => {
  return async function (req: Request, res: Response, next: NextFunction) {
    req.roles = roleCodes;
    next();
  };
};
