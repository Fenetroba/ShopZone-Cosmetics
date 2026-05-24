const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;

        // Check if user already exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update avatar in case it changed
          if (avatar && user.avatar !== avatar) {
            user.avatar = avatar;
            await user.save({ validateBeforeSave: false });
          }
          return done(null, user);
        }

        // Check if email already registered with local auth
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.authProvider = 'google';
            if (avatar && !user.avatar) user.avatar = avatar;
            user.isEmailVerified = true;
            await user.save({ validateBeforeSave: false });
            return done(null, user);
          }
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email,
          googleId: profile.id,
          authProvider: 'google',
          avatar: avatar || '',
          isEmailVerified: true,
          role: 'customer',
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
