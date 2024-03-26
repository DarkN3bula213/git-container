import { Roles } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { RoleModel } from '@/modules/auth/roles/role.model';
import { User } from '@/modules/auth/users/user.model';

const logger = new Logger(__filename);

export function authorize(requiredRole: Roles) {
  return asyncHandler(async (req, res, next) => {
    const user = req.user as User;
    if (!user || !user.roles) {
      logger.debug({
        event: 'User or user roles not found',
      });

      return res.status(401).send('Authentication required');
    }

    const role = await RoleModel.findOne({
      code: requiredRole,
    });

    if (!role) {
      return res.status(404).send('Required role not found');
    }

    if (typeof user.roles === 'string') {
      const roleIds = user.roles.split(',').map((roleId) => roleId.trim());
      if (roleIds.includes(role._id.toString())) {
        next();
        return
      } else {
        return res.status(403).send('Unauthorized');
      }
    } else if (Array.isArray(user.roles)) {
      const roleIds = user.roles.map((roleId) => roleId.toString());
      if (roleIds.includes(role._id.toString())) {
        next();
        return
      } else {
        return res.status(403).send('Unauthorized');
      }
    } else {
      return;
    }
  });
}
