import { Roles } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
// import { Logger } from '@/lib/logger';
import { normalizeRoles } from '@/lib/utils/utils';
import { RoleModel } from '@/modules/auth/roles/role.model';
import { User } from '@/modules/auth/users/user.model';

// const logger = new Logger(__filename);

export function authorize(requiredRole: Roles) {
	return asyncHandler(async (req, res, next) => {
		const user = req.user as User;
		if (!user || !user.roles) {
			return next();
		}

		const userRoles = normalizeRoles(user.roles);
		const role = await RoleModel.findOne({
			code: requiredRole
		});

		if (!role) {
			return next();
		}

		if (
			!userRoles
				.map((roleId) => roleId.toString())
				.includes(role._id.toString())
		) {
			return res.status(403).send('Forbidden: Insufficient permissions');
		} else {
			return next();
		}
	});
}
