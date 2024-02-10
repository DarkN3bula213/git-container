import { config } from '@/lib/config';
import passport from '@/lib/config/passport';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { signToken } from '@/lib/utils/tokens';
import jwt from 'jsonwebtoken';
import { User } from './users/user.model';
import { Logger } from '@/lib/logger';
import { KeystoreModel } from './keyStore/keyStore.model';

const logger = new Logger(__filename);
export const login = asyncHandler(async (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    (err: any, user: User, info: any) => {
      if (err || !user) {
        return res.status(401).json({
          message: info ? info.message : 'Login failed',
          user,
        });
      }

      req.login(user, { session: false }, (err) => {
        if (err) {
          return res.send(err);
        }

        const authenticatedUser: AuthenticatedUser = { user: user };

        logger.info(JSON.stringify(user));
        const access = signToken({ user }, 'access', {
          expiresIn: -1, // Adjust token expiration as needed
        });
        const refresh = signToken({ user }, 'refresh', {
          expiresIn: '7d', // Adjust token expiration as needed
        });
        KeystoreModel.createKeystore(user, access, refresh);
        req.user = authenticatedUser.user;
        return res.json({ user: user, access, refresh });
      });
    },
  )(req, res);
});

type AuthenticatedUser = {
  user: User;
};
