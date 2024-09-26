/* eslint-disable @typescript-eslint/no-namespace */
import { Roles } from '@/lib/constants';
import { NextFunction, Request, Response } from 'express';

declare global {
	namespace Express {
		export interface Request {
			roles: string;
		}
	}
}
export default (roleCodes: Roles) => {
	return async function (req: Request, _res: Response, next: NextFunction) {
		req.roles = roleCodes;
		next();
	};
};
