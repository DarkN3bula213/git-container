import { Router, Request, Response, NextFunction } from 'express';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

interface Route {
    path: string;
    method: Method;
    handler: (req: Request, res: Response, next: NextFunction) => void;
    validation?: (req: Request, res: Response, next: NextFunction) => void;
}

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

interface RecursiveRoute {
    path: string;
    method: Method;
    handler: (req: Request, res: Response, next: NextFunction) => void;
    validation?: (req: Request, res: Response, next: NextFunction) => void;
    preValidationMiddleware?: Middleware[];
    postValidationMiddleware?: Middleware[];
}

interface RouteMap {
    path: string;
    method: Method;
    handler: (req: Request, res: Response, next: NextFunction) => void;
    validations?: Array<
        (req: Request, res: Response, next: NextFunction) => void
    >;
}
