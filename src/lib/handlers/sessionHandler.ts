import { cache } from '@/data/cache/cache.service';
import RedisStore from 'connect-redis';
import type session from 'express-session';
import { getCookieOption } from '../config/cookies';
import { config } from '../config';

// Rest of the Express app setup...

export const sessionOptions: session.SessionOptions = {
  store: new RedisStore({ client: cache }),
  secret: config.tokens.jwtSecret,
  resave: false,
  saveUninitialized: false,
  cookie: getCookieOption('login'),
};
