import { Application } from 'express';
import session from 'express-session';
import { cache } from '@/data/cache/cache.service';
import RedisStore from 'connect-redis';

export const handleSession = (app: Application) => {
  app.use(
    session({
      store: new RedisStore({ client: cache.getClient() }),
      secret: 'crypto.randomUUID().toString()',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );
};

// Rest of the Express app setup...
