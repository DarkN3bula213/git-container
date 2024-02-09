import passport from 'passport';
import passportLocal from 'passport-local';

export const stratgy = new passportLocal.Strategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  (email, password, done) => {
    done(null, {});
  },
);
export const passportConfig = () => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null);
  });
};
