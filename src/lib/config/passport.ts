import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

// Import your user service or model here
import { User, UserModel } from '../../modules/auth/users/user.model';

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await UserModel.login(email, password);
        if (!user) {
          // No user found, or password did not match
          return done(null, false, { message: 'Incorrect email or password.' });
        }
        // Successful authentication
        return done(null, user); // Pass the user object to done
      } catch (error) {
        // An error occurred during the authentication process
        return done(error);
      }
    },
  ),
);

export default passport;
