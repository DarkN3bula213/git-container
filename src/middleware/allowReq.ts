import { Roles } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { verifyToken } from '@/lib/utils/tokens';
import { UserModel } from '@/modules/auth/users/user.model';

export const allowed = (allowedRoles: Roles[]) => {
  return asyncHandler(async (req, res, next) => {
    try {
      const token = req.cookies.access;
      if (!token) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { decoded, valid } = verifyToken(token, 'access');
      if (!valid) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = decoded?.user._id;
      const user = await UserModel.findById(userId).populate('roles').exec();

      if (!user) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const userRoles = user.roles.map((role) => role.toString());
      const hasRole = userRoles.some((role) =>
        allowedRoles.includes(role as Roles),
      );
      if (hasRole) {
        return next(); // Allow all HTTP methods if the user has the required role
      }

      if (req.method !== 'GET') {
        return res
          .status(403)
          .json({ message: 'Forbidden: Insufficient privileges' });
      }

      // Allow GET requests even if the role doesn't match
      next();
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  });
};
