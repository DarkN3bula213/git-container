import { Middleware, RecursiveRoute, Route, RouteMap } from '@/types/routes';
import { Router, Request, Response, NextFunction } from 'express';
import { func } from 'joi';

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
  res.cookie('accessToken', '', { httpOnly: true, secure: true, sameSite: 'none', maxAge: -1, domain: '.hps-admin.com' });
  res.cookie('refreshToken', '', { httpOnly: true, secure: true, sameSite: 'none', maxAge: -1, domain: '.hps-admin.com' });
};
