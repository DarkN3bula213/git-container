import { Middleware, RecursiveRoute, Route, RouteMap } from '@/types/routes';
import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Roles } from '../constants';
import Role, { RoleModel } from '@/modules/auth/roles/role.model';

export function applyRoutes(router: Router, routes: Route[]): void {
  routes.forEach((route) => {
    const { path, method, handler, validation } = route;

    if (validation) {
      router[method](path, validation, handler);
    } else {
      router[method](path, handler);
    }
  });
}

export function recursiveRouting(router: Router, routes: RecursiveRoute[]) {
  routes.forEach((route) => {
    router[route.method](route.path, (req, res, next) => {
      const executeMiddleware = (middlewares: Middleware[], index: number) => {
        if (index >= middlewares.length) {
          if (route.validation) {
            route.validation(req, res, () => {
              executeMiddleware(route.postValidationMiddleware || [], 0);
            });
          } else {
            route.handler(req, res, next);
          }
        } else {
          middlewares[index](req, res, () =>
            executeMiddleware(middlewares, index + 1),
          );
        }
      };

      executeMiddleware(route.preValidationMiddleware || [], 0);
    });
  });
}

function proof(): RecursiveRoute[] {
  return [
    {
      path: '/',
      method: 'get',
      validation: () => {},
      postValidationMiddleware: [() => {}],
      handler: () => {},
    },
  ];
}

export function setRouter(router: Router, routes: RouteMap[]): void {
  routes.forEach((route) => {
    const { path, method, handler, validations } = route;

    if (validations && validations.length) {
      router[method](path, ...validations, handler);
    } else {
      router[method](path, handler);
    }
  });
}

// Utility function to clear cookies
export const clearAuthCookies = (res: Response) => {
  res.cookie('accessToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: -1,
    domain: '.hps-admin.com',
  });
};

export const normalizeRoles = (
  roles: Types.ObjectId[] | Role[] | string[] | string,
): Types.ObjectId[] => {
  if (Array.isArray(roles)) {
    return roles.map((role) =>
      typeof role === 'string' ? new Types.ObjectId(role) : role._id,
    );
  } else {
    return [
      typeof roles === 'string'
        ? new Types.ObjectId(roles)
        : (roles as Role)._id,
    ];
  }
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
