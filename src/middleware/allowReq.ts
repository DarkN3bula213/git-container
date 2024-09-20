import { Roles } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { User } from '@/modules/auth/users/user.model';

const logger = new Logger(__filename);

export const allowed = (allowedRoles: Roles[]) => {
	return asyncHandler(async (req, res, next) => {
		try {
			logger.debug('Checking user authorization');
			const user = req.user as User;
			if (!user) {
				logger.debug('User not found in request');
				return res.status(403).json({ message: 'Unauthorized' });
			}
			logger.debug({
				user: user.id,
				roles: user.roles,
				allowedRoles
			});
			const userRoles = user.roles.map((role) => role.toString());
			logger.debug('User roles:', userRoles);

			logger.debug('Allowed roles:', allowedRoles);
			const hasRole = userRoles.some((role) =>
				allowedRoles.includes(role as Roles)
			);
			logger.debug('User has required role:', hasRole);
			if (hasRole) {
				logger.debug('Access granted: User has required role');
				return next(); // Allow all HTTP methods if the user has the required role
			}

			logger.debug('Request method:', req.method);
			if (req.method !== 'GET') {
				logger.debug(
					'Access denied: Insufficient privileges for non-GET request'
				);
				return res.status(403).json({
					message: 'Forbidden: Insufficient privileges'
				});
			}

			// Allow GET requests even if the role doesn't match
			logger.debug(
				'Access granted: GET request allowed without role check'
			);
			next();
		} catch (error) {
			console.error('Error in authorization middleware:', error);
			res.status(401).json({ message: 'Unauthorized' });
		}
	});
};
