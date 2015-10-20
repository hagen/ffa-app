var proxy = require('express-http-proxy');
var secrets = require('../../config/proxy.js');

module.exports = function(app, passport) {

  // Set up the environment specific path pattern
  var pattern = secrets.path + '*';

  // For all GET requests, we *may* need a user name. If the requested url
  // contains the pattern TESTUSER, we will replace it with the user's user Id
  app.get(pattern, passport.authenticate('bearer', {
    session: false
  }), proxy('hana.forefrontanalytics.com.au', {
    forwardPath: function(req, res) {
      // I need the user
      var path = require('url').parse(req.url).path.replace("TESTUSER", req.user.id);
      return path;
    },
    decorateRequest: function(req) {
      req.headers['Authorization'] = secrets.digests[0];
      return req;
    }
  }))

  // POST requests.
  .post(pattern, passport.authenticate('bearer', {
    session: false
  }), proxy('hana.forefrontanalytics.com.au', {
    forwardPath: function(req, res) {
      var path = require('url').parse(req.url).path.replace("TESTUSER", req.user.id);
      return path;
    },
    decorateRequest: function(req) {
      req.headers['Authorization'] = secrets.digests[0];
      return req;
    }
  }))

  // MERGE requests.
  .merge(pattern, passport.authenticate('bearer', {
    session: false
  }), proxy('hana.forefrontanalytics.com.au', {
    forwardPath: function(req, res) {
      var path = require('url').parse(req.url).path.replace("TESTUSER", req.user.id);
      return path;
    },
    decorateRequest: function(req) {
      req.headers['Authorization'] = secrets.digests[0];
      return req;
    }
  }))

  // DELETE
  .delete(pattern, passport.authenticate('bearer', {
    session: false
  }), proxy('hana.forefrontanalytics.com.au', {
    forwardPath: function(req, res) {
      var path = require('url').parse(req.url).path.replace("TESTUSER", req.user.id);
      return path;
    },
    decorateRequest: function(req) {
      req.headers['Authorization'] = secrets.digests[0];
      return req;
    }
  }));
};
