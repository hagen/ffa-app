// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var LinkedInStrategy = require('passport-linkedin').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
//var SamlStrategy = require('passport-saml').Strategy

// load up the user model
var User = require('../app/models/user');

module.exports = function(passport) {


  var secrets = require('./secrets.js');

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    var createAccessToken = function() {
      var token = user.generateRandomToken();
      User.findOne({
        accessToken: token
      }, function(err, existingUser) {
        if (err) {
          return done(err);
        }
        if (existingUser) {
          createAccessToken(); // Run the function again - the token has to be unique!
        } else {
          user.set('accessToken', token);
          user.save(function(err) {
            if (err) return done(err);
            return done(null, user.get('accessToken'));
          })
        }
      });
    };

    if (user._id) {
      createAccessToken();
    }
  });

  // used to deserialize the user
  passport.deserializeUser(function(token, done) {
    User.findOne({
      accessToken: token
    }, function(err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // BEARER ==================================================================
  // =========================================================================
  passport.use('bearer', new BearerStrategy({
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, token, done) {
      User.findOne({
          accessToken: token
        },
        function(err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          return done(null, user, {
            scope: 'read'
          });
        }
      );
    }
  ));

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-register', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

      // asynchronous
      // User.findOne wont fire unless data is sent back
      process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({
          'local.email': email
        }, function(err, user) {
          // if there are any errors, return the error
          if (err)
            return done(err);

          // check to see if theres already a user with that email
          if (user) {
            return done(null, false); //, req.flash('signupMessage', 'That email is already taken.'));
          } else {

            // if there is no user with that email
            // create the user
            var newUser = new User();

            // set the user's local credentials
            newUser.local.email     = email;
            newUser.local.firstname = req.body.firstname;
            newUser.local.lastname  = req.body.lastname;
            newUser.accessToken     = newUser.generateRandomToken();
            newUser.generateHash(password, function(err, hash) {
              if (err) {
                return done(err);
              }
              newUser.local.password = hash;
              // save the user
              newUser.save(function(err) {
                if (err) {
                  return done(err);
                }
                return done(null, newUser);
              });
            });
          }
        });
      });
    }));

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    }, function(req, email, password, done) { // callback with email and password from our form
      process.nextTick(function() {
        User.findOne({
          'local.email': email
        }, function(err, user) {
          // if there are any errors, return the error before anything else
          if (err)
            return done(err);

          // if no user is found, return the message
          if (!user) {
            return done(null, false); //, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
          }

          user.validPassword(password, function(err, valid) {
            if (!valid) {
              return done(null, false);
            } else {
              // all is well, generate accessToken and return user
              user.accessToken = user.generateRandomToken();
              user.save(function(err, doc) {
                if(err) {
                  return done(null, false); //, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
                }
                return done(null, doc);
              });
            }
          });
        });
      });
    }));

  passport.use('local-connect', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
      // asynchronous
      // User.findOne wont fire unless data is sent back
      process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({
          'accessToken': req.body.accessToken
        }, function(err, user) {
          // if there are any errors, return the error
          if (err)
            return done(err);

          // check to see if theres already a user with that email
          if (user) {
            // That email is already taken! Shouldn't happen. Ever
            user.local.email = email;
            user.generateHash(password, function(err, hash) {
              if (err) {
                return done(err);
              }
              user.local.password = hash;
              // save the user
              user.save(function(err) {
                if (err) {
                  return done(err);
                }
                return done(null, user);
              });
            });
          } else {
            // Couldn't find a user with that bearer token
            return done(null, false);
          }
        });
      });
    }));

  // =========================================================================
  // GOOGLE ==================================================================
  // =========================================================================
  passport.use('google', new GoogleStrategy({
      clientID: secrets.google.clientID,
      clientSecret: secrets.google.clientSecret,
      callbackURL: secrets.google.callbackURL,
      passReqToCallback: true, // allows us to pass back the entire request to the callback
      profile: true
    },
    function(req, token, refreshToken, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function() {
        // try to find the user based on their google id
        User.findOne({
          'google.id': profile.id
        }, function(err, user) {
          if (err)
            return done(err);

          if (user) {

            // if a user is found, log them in
            user.google.token = token;
            user.accessToken = user.generateRandomToken();
            user.save(function(err, doc) {
              return done(null, doc);
            });
          } else {
            // if the user isnt in our database, create a new user
            var newUser = new User();

            // set all of the relevant information
            newUser.accessToken = newUser.generateRandomToken();
            newUser.google.id = profile.id;
            newUser.google.token = token;
            newUser.google.name = profile.displayName;
            newUser.google.email = profile.emails[0].value; // pull the first email

            // save the user
            newUser.save(function(err) {
              if (err) {
                throw err;
              }
              return done(null, newUser);
            });
          }
        });
      });
    }
  ));

  passport.use('google-connect', new GoogleStrategy({
      clientID: secrets.google.clientID,
      clientSecret: secrets.google.clientSecret,
      callbackURL: secrets.google.callbackURLConnect,
      passReqToCallback: true, // allows us to pass back the entire request to the callback
      profile: true
    },
    function(req, token, refreshToken, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function() {
        // try to find the user based on their google id
        User.findOne({
          'google.id': profile.id
        }, function(err, user) {
          if (err)
            return done(err);

          if (user) {

            // if a user is found, log them in
            user.google.token = token;
            user.accessToken = user.generateRandomToken();
            user.save(function(err, doc) {
              return done(null, doc);
            });
          } else {
            // if the user isnt in our database, create a new user
            var newUser = new User();

            // set all of the relevant information
            newUser.accessToken = newUser.generateRandomToken();
            newUser.google.id = profile.id;
            newUser.google.token = token;
            newUser.google.name = profile.displayName;
            newUser.google.email = profile.emails[0].value; // pull the first email

            // save the user
            newUser.save(function(err) {
              if (err) {
                throw err;
              }
              return done(null, newUser);
            });
          }
        });
      });
    }
  ));

  // =========================================================================
  // Twitter =================================================================
  // =========================================================================
  passport.use('twitter', new TwitterStrategy({
      consumerKey: secrets.twitter.consumerKey,
      consumerSecret: secrets.twitter.consumerSecret,
      callbackURL: secrets.twitter.callbackURL,
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, token, tokenSecret, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function() {

        // try to find the user based on their google id
        User.findOne({
          'twitter.id': profile.id
        }, function(err, user) {
          if (err)
            return done(err);

          if (user) {

            // if a user is found, log them in
            user.twitter.token = token;
            user.accessToken = user.generateRandomToken();
            user.save(function(err, doc) {
              return done(null, doc);
            });
          } else {
            // if the user isnt in our database, create a new user
            var newUser = new User();

            // set all of the user data that we need
            newUser.accessToken = newUser.generateRandomToken();
            newUser.twitter.id = profile.id;
            newUser.twitter.token = token;
            newUser.twitter.username = profile.username;
            newUser.twitter.displayName = profile.displayName;

            // save the user
            newUser.save(function(err) {
              if (err) {
                throw err;
              }
              return done(null, newUser);
            });
          }
        });
      });
    }
  ));

  passport.use('twitter-connect', new TwitterStrategy({
      consumerKey: secrets.twitter.consumerKey,
      consumerSecret: secrets.twitter.consumerSecret,
      callbackURL: secrets.twitter.callbackURLConnect,
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, token, tokenSecret, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function() {

        // try to find the user based on their google id
        User.findOne({
          'twitter.id': profile.id
        }, function(err, user) {
          // if any errors, return them
          if (err)
            return done(err);

          // check to see if there's already a user with that twitter id
          if (user) {

            // if a user is found, log them in
            user.twitter.token = token;
            user.accessToken = user.generateRandomToken();
            user.save(function(err, doc) {
              return done(null, doc);
            });
          } else {
            // if the user isnt in our database, create a new user
            var newUser = new User();

            // set all of the user data that we need
            newUser.accessToken = newUser.generateRandomToken();
            newUser.twitter.id = profile.id;
            newUser.twitter.token = token;
            newUser.twitter.username = profile.username;
            newUser.twitter.displayName = profile.displayName;

            // save the user
            newUser.save(function(err) {
              if (err) {
                throw err;
              }
              return done(null, newUser);
            });
          }
        });
      });
    }
  ));

  // =========================================================================
  // LinkedIn ================================================================
  // =========================================================================
  passport.use('linkedin', new LinkedInStrategy({
      consumerKey: secrets.linkedin.clientID,
      consumerSecret: secrets.linkedin.clientSecret,
      callbackURL: secrets.linkedin.callbackURL,
      passReqToCallback: true, // allows us to pass back the entire request to the callback
      profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline']
    },
    function(req, token, tokenSecret, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function() {

        // try to find the user based on their google id
        User.findOne({
          'linkedin.id': profile.id
        }, function(err, user) {
          if (err)
            return done(err);

          if (user) {

            // if a user is found, log them in
            user.linkedin.token = token;
            user.accessToken = user.generateRandomToken();
            user.save(function(err, doc) {
              return done(null, doc);
            });
          } else {
            // if the user isnt in our database, create a new user
            var newUser = new User();

            // set all of the user data that we need
            newUser.accessToken = newUser.generateRandomToken();
            newUser.linkedin.id = profile.id;
            newUser.linkedin.token = token;
            newUser.linkedin.email = profile._json.emailAddress;
            newUser.linkedin.firstname = profile._json.firstName;
            newUser.linkedin.lastname = profile._json.lastName;
            newUser.linkedin.headline = profile._json.headline;

            // save the user
            newUser.save(function(err) {
              if (err)
                throw err;
              return done(null, newUser);
            });
          }
        });
      });
    }
  ));

  passport.use('linkedin-connect', new LinkedInStrategy({
      consumerKey: secrets.linkedin.clientID,
      consumerSecret: secrets.linkedin.clientSecret,
      callbackURL: secrets.linkedin.callbackURLConnect,
      passReqToCallback: true, // allows us to pass back the entire request to the callback
      profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline']
    },
    function(req, token, tokenSecret, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function() {

        // try to find the user based on their google id
        User.findOne({
          'linkedin.id': profile.id
        }, function(err, user) {
          if (err)
            return done(err);

          if (user) {

            // if a user is found, log them in
            user.linkedin.token = token;
            user.accessToken = user.generateRandomToken();
            user.save(function(err, doc) {
              return done(null, doc);
            });
          } else {
            // if the user isnt in our database, create a new user
            var newUser = new User();

            // set all of the user data that we need
            newUser.accessToken = newUser.generateRandomToken();
            newUser.linkedin.id = profile.id;
            newUser.linkedin.token = token;
            newUser.linkedin.email = profile._json.emailAddress;
            newUser.linkedin.firstname = profile._json.firstName;
            newUser.linkedin.lastname = profile._json.lastName;
            newUser.linkedin.headline = profile._json.headline;

            // save the user
            newUser.save(function(err) {
              if (err)
                throw err;
              return done(null, newUser);
            });
          }
        });
      });
    }
  ));
};
