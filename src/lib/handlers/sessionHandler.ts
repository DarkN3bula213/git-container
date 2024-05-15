import session from 'express-session';
import { cache } from '@/data/cache/cache.service';
import RedisStore from 'connect-redis';
import { convertToMilliseconds } from '../utils/fns';

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
