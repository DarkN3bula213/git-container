import { Roles } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { RoleModel, getUserRoles } from '@/modules/auth/roles/role.model';
import { User } from '@/modules/auth/users/user.model';

const logger = new Logger(__filename);

export function authorize(requiredRole: Roles) {
  return asyncHandler(async (req, res, next) => {
    const user = req.user as User;
    if (!user || !user.roles) {
      logger.debug({
        event: 'User or user roles not found',
      });

      return next();
      // return res.status(401).send('Authentication required');
    }

    const role = await RoleModel.findOne({
      code: requiredRole,
    });

    if (!role) {
      logger.debug({
        event: 'Required role not found',
        role: requiredRole,
        user: user.roles,
        result: JSON.stringify(role),
      });
      return next();
      // return res.status(404).send('Required role not found');
    }
    if (user.roles.toString() !== role._id.toString()) {
      logger.debug({
        event: 'Insufficient permissions',
        role: role._id,
        user: user.roles,
        result: JSON.stringify(role),
      });
      return next();
      // return res.status(403).send('Forbidden: Insufficient permissions');
    }
    logger.debug({
      event: 'Authorized',
      role: role._id,
      user: user.roles,
      result: JSON.stringify(role),
    });
    next();
  });
}
