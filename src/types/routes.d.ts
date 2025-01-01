import { NextFunction, Request, Response } from 'express';

interface Route {
	path: string;
	method: Method;
	handler: (req: Request, res: Response, next: NextFunction) => void;
	validation?: (req: Request, res: Response, next: NextFunction) => void;
}

interface RecursiveRoute {
	path: string;
	method: Method;
	handler: (req: Request, res: Response, next: NextFunction) => void;
	validation?: (req: Request, res: Response, next: NextFunction) => void;
	preValidationMiddleware?: Middleware[];
	postValidationMiddleware?: Middleware[];
}

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type StaticRoute = {
	path: string; // No dynamic segments
	method: Method;
	handler: (req: Request, res: Response, next: NextFunction) => void;
	validations?: Middleware[];
};

type DynamicRoute = {
	path: `/${string}/:${string}`; // At least one dynamic segment
	method: Method;
	handler: (req: Request, res: Response, next: NextFunction) => void;
	validations?: Middleware[];
};

type RouteMap = StaticRoute | DynamicRoute;
