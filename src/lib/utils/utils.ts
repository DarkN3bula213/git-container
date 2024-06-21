import type Role from '@/modules/auth/roles/role.model';
import { RoleModel } from '@/modules/auth/roles/role.model';
import type {
  Middleware,
  RecursiveRoute,
  Route,
  RouteMap,
} from '@/types/routes';
import type { Response, Router } from 'express';
import { Types } from 'mongoose';
import { logoutCookie } from '../config/cookies';
import { Roles } from '../constants';

export function setRouter(router: Router, routes: RouteMap[]): void {
  for (const route of routes) {
    const { path, method, handler, validations } = route;

    if (validations?.length) {
      router[method](path, ...validations, handler);
    } else {
      router[method](path, handler);
    }
  }
}

// Utility function to clear cookies
export const clearAuthCookies = (res: Response) => {
  res.cookie('access', '', logoutCookie);
};

export const normalizeRoles = (
  roles: Types.ObjectId[] | Role[] | string[] | string,
): Types.ObjectId[] => {
  if (Array.isArray(roles)) {
    return roles.map((role) =>
      typeof role === 'string' ? new Types.ObjectId(role) : role._id,
    );
  }
  return [
    typeof roles === 'string' ? new Types.ObjectId(roles) : (roles as Role)._id,
  ];
};

export const isAdminRolePresent = async (
  userRoles: Types.ObjectId[],
): Promise<boolean> => {
  const adminRole = await RoleModel.findOne({
    _id: { $in: userRoles },
    code: Roles.ADMIN,
  });
  return !!adminRole;
};

export const fetchRoleCodes = async (roleIds: Types.ObjectId[]) => {
  try {
    const roles = await RoleModel.find({
      _id: { $in: roleIds.map((id) => new Types.ObjectId(id)) },
    }).select('code -_id');

    return roles.map((role) => role.code);
  } catch (error) {
    console.error('Error fetching role codes:', error);
    throw error;
  }
};

export const fetchUserPermissions = async (roleIds: Types.ObjectId[]) => {
  try {
    const roles = await RoleModel.find({
      _id: { $in: roleIds.map((id) => new Types.ObjectId(id)) },
    });

    return roles.map((role) => role.code);
  } catch (error) {
    console.error('Error fetching role codes:', error);
    throw error;
  }
};
import QRCode from 'qrcode';

export async function generateQRCode(token: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(token);
    return qrCodeDataURL;
  } catch (err: any) {
    throw new Error('Error generating QR Code: ' + err.message);
  }
}
