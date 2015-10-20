// load up the user model
var User = require('../models/user');

module.exports = function(app, passport) {

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/register/check/:email', function(req, res) {
    if(!req.params.email) {
      res.json({ in_use : false });
      return;
    }

    // Else query MongoDB
    User.findOne({ 'local.email' : req.params.email }, function(err, result) {
      if(result) {
        res.json({ in_use : true });
      } else  {
        res.json({ in_use : false });
      }
    });
  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/auth/logout', function(req, res) {
    req.logout();
    res.redirect('/#/login');
  });

  // =====================================
  // LINKING =============================
  // =====================================
  app.post('/auth/profile/link', passport.authenticate('bearer', {
    session: false
  }), function(req, res) {
    if(req.body.link && req.user) {
      req.user.set('linkToken', req.body.link);
      req.user.save(function(err) {
        if(err) {
          res.json({
            status : 'Failed',
            message : 'Couldn\'t save link token'
          });
        } else {
          res.json({
            status : 'Success',
            message : 'Link token saved'
          });
        }
      });
    }
  });

  // =====================================
  // LOCAL ===============================
  // =====================================
  // process the signup form
  app.post('/auth/local/register', passport.authenticate('local-register', {
    failureRedirect: '/#/noauth', // redirect back to the signup page if there is an error
    failureFlash: false // allow flash messages
  }), function(req, res) {
    res.redirect("/#/auth/local/token/" + req.user.accessToken);
  });

  // process the login form
  app.post('/auth/local/login', passport.authenticate('local-login', {
    failureRedirect: '/#/noauth', // redirect back to the signup page if there is an error
    failureFlash: false // allow flash messages
  }), function(req, res) {
    res.redirect("/#/auth/local/token/" + req.user.accessToken);
  });

  // send to google to do the authorization
  app.post('/connect/local', passport.authorize('local-connect', {
    failureRedirect: '/#/noauth', // redirect back to the signup page if there is an error
    failureFlash: false // allow flash messages
  }), function(req, res) {
    res.json({
      status : 'Success',
      message : 'Local user account created and linked'
    });
  });

  // Disconnect Google
  app.get('/disconnect/local', passport.authenticate('bearer', {
    session: false,
  }), function(req, res) {
    var user            = req.user;
    user.local.email    = undefined;
    user.local.password = undefined;
    user.save(function(err) {
       res.json({ message : 'Local unlinked' });
    });
  });

  // =====================================
  // GOOGLE ==============================
  // =====================================
  app.get('/auth/google', passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email']
  }));

  app.get('/auth/google/callback', passport.authenticate('google', {
    session: false,
    failureRedirect: '/#/noauth'
  }), function(req, res) {
    res.redirect("/#/auth/google/token/" + req.user.accessToken);
  });

  // send to google to do the authorization
  app.get('/connect/google', passport.authenticate('google-connect', {
    session: false,
    scope: ['profile', 'email']
  }));

  // the callback after google has authorized the user
  app.get('/connect/google/callback', passport.authenticate('google-connect', {
    session: false,
    failureRedirect: '/'
  }), function(req, res) {
    res.redirect("/#/connect/google/token/" + req.user.accessToken);
  });

  // Merge Google account
  app.post('/auth/profile/merge/google', passport.authenticate('bearer', {
    session: false
  }), function(req, res) {

    if (req.body.link && req.user) {
      User.findOne({
        linkToken : req.body.link
      }, function(err, existingUser) {
        if (err || !existingUser) {
          res.json({
            status : 'Error',
            message: 'User couldn\'t be found to merge'
          });
        } else  {
          existingUser.set('accessToken', req.user.accessToken);
          existingUser.set('google.id', req.user.google.id);
          existingUser.set('google.token', req.user.google.token);
          existingUser.set('google.email', req.user.google.email);
          existingUser.set('google.name', req.user.google.name);
          existingUser.save(function(err) {
            if(err) {
              res.json({
                status : 'Error',
                message : 'User\'s Google credentials couldn\'t be saved'
              });
            } else {
              // Only remove the user if this is not a relink. A relink means The
              // _id values will be the same.
              if(existingUser.id !== req.user.id) {
                User.remove({ _id : req.user._id }, function(err) {
                  res.json({
                    status : 'Success',
                    message : 'User\'s Google credentials merged and old user deleted!'
                  });
                });
              } else {
                res.json({
                  status : 'Success',
                  message : 'User\'s Google credentials merged from existing user!'
                });
              }
            }
          });
        }
      });
    }
  });

  // Disconnect Google
  app.get('/disconnect/google', passport.authenticate('bearer', {
    session: false,
  }), function(req, res) {
    var user          = req.user;
    user.google.token = undefined;
    user.save(function(err) {
       res.json({ message : 'Google unlinked' });
    });
  });

  // =====================================
  // TWITTER =============================
  // =====================================
  app.get('/auth/twitter', passport.authenticate('twitter', {
    session: false,
    scope : 'email'
  }));

  app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    session: false,
    failureRedirect: '/#/noauth'
  }), function(req, res) {
    res.redirect("/#/auth/twitter/token/" + req.user.accessToken);
  });

  // send to twitter to do the authentication
  app.get('/connect/twitter', passport.authenticate('twitter-connect', {
    session: false,
    scope : 'email'
  }));

  // the callback after google has authorized the user
  app.get('/connect/twitter/callback', passport.authenticate('twitter-connect', {
    session: false,
    failureRedirect: '/'
  }), function(req, res) {
    res.redirect("/#/connect/twitter/token/" + req.user.accessToken);
  });

  // Merge Twitter
  app.post('/auth/profile/merge/twitter', passport.authenticate('bearer', {
    session: false
  }), function(req, res) {

    if (req.body.link && req.user) {
      User.findOne({
        linkToken : req.body.link
      }, function(err, existingUser) {
        if (err || !existingUser) {
          res.json({
            status : 'Error',
            message: 'User couldn\'t be found to merge'
          });
        } else  {
          existingUser.set('accessToken', req.user.accessToken);
          existingUser.set('twitter.id', req.user.twitter.id);
          existingUser.set('twitter.token', req.user.twitter.token);
          existingUser.set('twitter.displayName', req.user.twitter.displayName);
          existingUser.set('twitter.username', req.user.twitter.username);
          existingUser.save(function(err) {
            if(err) {
              res.json({
                status : 'Error',
                message : 'User\'s Twitter credentials couldn\'t be saved'
              });
            } else {
              // Only remove the user if this is not a relink. A relink means The
              // _id values will be the same.
              if(existingUser.id !== req.user.id) {
                User.remove({ _id : req.user._id }, function(err) {
                  res.json({
                    status : 'Success',
                    message : 'User\'s Twitter credentials merged and old user deleted!'
                  });
                });
              } else {
                res.json({
                  status : 'Success',
                  message : 'User\'s Twitter credentials merged from existing user!'
                });
              }
            }
          });
        }
      });
    }
  });

  // Disconnect Twitter
  app.get('/disconnect/twitter', passport.authenticate('bearer', {
    session: false,
  }), function(req, res) {
    var user           = req.user;
    user.twitter.token = undefined;
    user.save(function(err) {
       res.json({ message : 'Twitter unlinked' });
    });
  });

  // =====================================
  // LINKEDIN ============================
  // =====================================
  app.get('/auth/linkedin', passport.authenticate('linkedin', {
    session : false,
    scope: ['r_basicprofile', 'r_emailaddress']
  }));

  app.get('/auth/linkedin/callback', passport.authenticate(['bearer','linkedin'], {
    session: false,
    failureRedirect: '/#/noauth'
  }), function(req, res) {
    res.redirect("/#/auth/linkedin/token/" + req.user.accessToken);
  });

  // send to google to do the authentication
  app.get('/connect/linkedin', passport.authenticate('linkedin-connect', {
    session: false,
    scope: ['r_basicprofile', 'r_emailaddress']
  }));

  // the callback after LinkedIn has authorized the user
  app.get('/connect/linkedin/callback', passport.authenticate('linkedin-connect', {
    session: false,
    failureRedirect: '/#/noauth'
  }), function(req, res) {
    res.redirect("/#/connect/linkedin/token/" + req.user.accessToken);
  });

  // Merge LinkedIn
  app.post('/auth/profile/merge/linkedin', passport.authenticate('bearer', {
    session: false
  }), function(req, res) {

    if (req.body.link && req.user) {
      User.findOne({
        linkToken : req.body.link
      }, function(err, existingUser) {
        if (err || !existingUser) {
          res.json({
            status : 'Error',
            message: 'User couldn\'t be found to merge'
          });
        } else  {
          existingUser.set('accessToken', req.user.accessToken);
          existingUser.set('linkedin.id', req.user.linkedin.id);
          existingUser.set('linkedin.token', req.user.linkedin.token);
          existingUser.set('linkedin.email', req.user.linkedin.email);
          existingUser.set('linkedin.firstname', req.user.linkedin.firstname);
          existingUser.set('linkedin.lastname', req.user.linkedin.lastname);
          existingUser.set('linkedin.headline', req.user.linkedin.headline);
          existingUser.save(function(err) {
            if(err) {
              res.json({
                status : 'Error',
                message : 'User\'s LinkedIn credentials couldn\'t be saved'
              });
            } else {
              debugger;
              // Only remove the user if this is not a relink. A relink means The
              // _id values will be the same.
              if(existingUser.id !== req.user.id) {
                User.remove({ _id : req.user._id }, function(err) {
                  res.json({
                    status : 'Success',
                    message : 'User\'s LinkedIn credentials merged and old user deleted!'
                  });
                });
              } else {
                res.json({
                  status : 'Success',
                  message : 'User\'s LinkedIn credentials merged from existing user!'
                });
              }
            }
          });
        }
      });
    }
  });

  // Disconnect LinkedIn
  app.get('/disconnect/linkedin', passport.authenticate('bearer', {
    session: false,
  }), function(req, res) {
    var user            = req.user;
    user.linkedin.token = undefined;
    user.save(function(err) {
       res.json({ message : 'LinkedIn unlinked' });
    });
  });

  // =====================================
  // PROFILE =============================
  // =====================================
  app.get('/auth/api/user', passport.authenticate('bearer', {
    session: false
  }), function(req, res) {
    res.json({
      userid: req.user._id
    });
  });

  app.get('/auth/api/profile', passport.authenticate('bearer', {
    session: false
  }), function(req, res) {
    res.json(req.user);
  });

};

// route middleware to make sure
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/#/login');
}
