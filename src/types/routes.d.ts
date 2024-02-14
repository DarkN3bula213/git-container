import { Router, Request, Response, NextFunction } from 'express';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

interface Route {
  path: string;
  method: Method;
  handler: (req: Request, res: Response, next: NextFunction) => void;
  validation?: (req: Request, res: Response, next: NextFunction) => void;
}
