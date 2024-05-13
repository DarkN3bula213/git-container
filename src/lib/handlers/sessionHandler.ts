import { Application } from 'express';
import session from 'express-session';
import { cache } from '@/data/cache/cache.service';
import RedisStore from 'connect-redis';
import { convertToMilliseconds } from '../utils/fns';
 

export const handleSession = (app: Application) => {
  app.use(
    session({
      store: new RedisStore({ client: cache.getClient() }),
      secret: 'koka',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: false,
        secure: false,
        sameSite: 'none',
 
        maxAge: convertToMilliseconds('2h'),
      },
    }),
  );
};

// Rest of the Express app setup...

export const sessionOptions: session.SessionOptions = {
  store: new RedisStore({ client: cache }),
  secret: 'delayed-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.hps-admin.com',
    maxAge: convertToMilliseconds('2h'),
  },
};
