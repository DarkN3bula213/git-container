import { Route } from '@/types/routes';
import { Router } from 'express';

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
