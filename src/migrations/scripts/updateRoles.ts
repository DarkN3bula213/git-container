import { Actions, Resources, Roles } from '@/lib/constants';
import { Logger } from '@/lib/logger';
import { RoleModel } from '@/modules/auth/roles/role.model';

const logger = new Logger(__filename);

export const initializeOrUpdateRolesAndPermissions = async () => {
	const allResources = Object.values(Resources);
	const adminPermissions = allResources
		.map((resource) => [
			{ resource, action: Actions.READ },
			{ resource, action: Actions.WRITE }
		])
		.flat();

	const defaultPermissions = allResources.map((resource) => ({
		resource,
		action: Actions.READ
	}));

	// Define expected roles with their permissions
	const expectedRoles = [
		{
			code: Roles.ADMIN,
			permissions: adminPermissions
		},
		{
			code: Roles.HPS,
			permissions: defaultPermissions
		},
		{
			code: Roles.AUX,
			permissions: defaultPermissions
		},
		{
			code: Roles.READONLY,
			permissions: defaultPermissions
		},
		{
			code: Roles.GUEST,
			permissions: defaultPermissions
		},
		{
			code: Roles.EDITOR,
			permissions: defaultPermissions
		}
	];

	for (const expectedRole of expectedRoles) {
		const existingRole = await RoleModel.findOne({
			code: expectedRole.code
		});

		if (existingRole) {
			// Check if the permissions are in the old format (array of strings)
			if (
				existingRole.permissions.some(
					(perm) => typeof perm === 'string'
				)
			) {
				// Unset old permissions array
				existingRole.permissions = [];
			}
			// Set the correct permissions structure
			existingRole.permissions = expectedRole.permissions;
			existingRole.updatedAt = new Date(); // Manually update the updatedAt field
			await existingRole.save();
			logger.info(`Updated role: ${expectedRole.code}`);
		} else {
			// Create new role if it doesn't exist
			await RoleModel.create({
				...expectedRole,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			logger.info(`Created role: ${expectedRole.code}`);
		}
	}

	logger.info('Roles and permissions initialized');
};
export async function removePermissionsField() {
	try {
		const result = await RoleModel.updateMany(
			{},
			{ $unset: { permissions: '' } }
		);
		logger.info(
			`Removed permissions field from ${result.upsertedCount} documents`
		);
	} catch (error) {
		logger.error(`Error removing permissions field: ${error}`);
	}
}
