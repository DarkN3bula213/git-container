import { sessionCookie } from '@/lib/config/cookies';
import { Request, Response, NextFunction } from 'express';

const sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies['sessionId']) {
        const sessionId = crypto.randomUUID();
        res.cookie('sessionId', sessionId, sessionCookie);
        res.locals.sessionId = sessionId;
    } else {
        res.locals.sessionId = req.cookies['sessionId'];
    }
    next();
};

export default sessionMiddleware;
