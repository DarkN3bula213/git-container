import { Roles } from '@/lib/constants';
import { Logger } from '@/lib/logger';
import { RoleModel } from '@/modules/auth/roles/role.model';

const logger = new Logger(__filename);

export async function updateDatabase() {
  const roles = [
    {
      code: Roles.ADMIN,
      permissions: ['READALL', 'WRITE', 'DELETE', 'UPDATE'],
    },
    { code: Roles.HPS, permissions: ['READALL'] },
    { code: Roles.AUX, permissions: ['READALL', 'WRITE'] },
    { code: Roles.READONLY, permissions: ['READALL'] },
  ];

  try {
    const existingRoles = await RoleModel.find({}).exec();

    if (
      existingRoles.length === roles.length &&
      existingRoles.every((role) => {
        const desiredRole = roles.find((r) => r.code === role.code);
        return (
          desiredRole &&
          role.permissions.length === desiredRole.permissions.length &&
          role.permissions.every((p) => desiredRole.permissions.includes(p))
        );
      })
    ) {
      logger.info('No updates needed, roles are up-to-date.');
      return;
    }

    for (const role of roles) {
      await RoleModel.findOneAndUpdate(
        { code: role.code },
        { $set: role },
        { upsert: true, new: true },
      );
    }
    logger.info('Successfully updated roles');
  } catch (error) {
    logger.error('Error updating roles:', error);
    throw error;
  }
}
export async function removePermissionsField() {
  try {
    const result = await RoleModel.updateMany(
      {},
      { $unset: { permissions: '' } },
    );
    logger.info(
      `Removed permissions field from ${result.upsertedCount} documents`,
    );
  } catch (error) {
    logger.error(`Error removing permissions field: ${error}`);
  }
}
