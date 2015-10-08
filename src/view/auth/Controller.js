jQuery.sap.declare("com.ffa.hpc.view.auth.Controller");

// Provides controller com.ffa.hpc.util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/util/Controller"],
  function(jQuery, UtilController) {
    "use strict";

    var Controller = UtilController.extend("com.ffa.hpc.view.auth.Controller", /** @lends com.ffa.hpc.view.auth.Controller */ {

    });

    /***
     *     ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗
     *    ██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝
     *    ██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║
     *    ██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║
     *    ╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║
     *     ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝
     *
     */

    /**
     * Connect the user's existing profile to the supplied provider profile; This
     * is done by reading the Social provider details, now stored in Mongo, And
     * forwarding these to HANA
     * @param  {String}   sToken    Bearer token to use for jQuery call
     * @param  {String}   sProvider Social provider, required for connecting
     * @param  {Function} done      Call when done
     */
    Controller.prototype.connect = function(sToken, sProvider, done) {
      var oModel = this.getView().getModel("profile");

      // Read social stuff from node

      var oProfiles = {};
      var oHeaders = {
        Authorization: 'Bearer ' + sToken
      };
      jQuery.ajax({
        url: '/auth/api/profile',
        type: 'GET',
        headers: oHeaders, // Do not use the root controller function here
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {
          oProfiles = oData;
          // Now, update their social profile
          // oProfiles should have a named array, matching the provider
          var fn = "connect" + sProvider.charAt(0).toUpperCase() + sProvider.slice(1);
          if (typeof this[fn] === "function") {
            this[fn].apply(this, [oModel, oProfiles, done]);
          }
        }, this),
        error: jQuery.proxy(function(mError) {

        }, this)
      });
    };

    /**
     * Connect up the Linkedin account
     * @param  {String}   sToken    Bearer token to use for jQuery call
     * @param  {String}   sProvider Social provider, required for connecting
     * @param  {Function} done      Call when done
     */
    Controller.prototype.connectLocal = function(oModel, oProfiles, done) {
      var oProfile = {
        profile_id: this.getUserId(),
        email: oProfiles.local.email,
        first_name: oProfiles.local.firstname,
        last_name: oProfiles.local.lastname,
        linked: 'X'
      };

      // Do the create
      oModel.update("/LocalProfiles('TESTUSER')", oProfile, {
        success: jQuery.proxy(function(oData, mResponse) {
          // Now we continue on to the Social stuff.
          if (done) { done(); }
        }, this),
        error: jQuery.proxy(function(mError) {
          this.maybeHandleAuthError(mError);
        }, this),
        async: true,
        merge: true
      });
    };

    /**
     * Connect up the Google account
     * @param  {String}   sToken    Bearer token to use for jQuery call
     * @param  {String}   sProvider Social provider, required for connecting
     * @param  {Function} done      Call when done
     */
    Controller.prototype.connectGoogle = function(oModel, oProfiles, done) {
      var oProfile = {
        profile_id: this.getUserId(),
        id: oProfiles.google.id,
        name: oProfiles.google.name,
        email: oProfiles.google.email,
        linked: 'X'
      };

      // Do the create
      oModel.update("/GoogleProfiles('TESTUSER')", oProfile, {
        success: jQuery.proxy(function(oData, mResponse) {
          // Now we continue on to the Social stuff.
          if (done) { done(); }
        }, this),
        error: jQuery.proxy(function(mError) {
          this.maybeHandleAuthError(mError);
        }, this),
        async: true,
        merge: true
      });
    };

    /**
     * Connect up the Twitter account
     * @param  {String}   sToken    Bearer token to use for jQuery call
     * @param  {String}   sProvider Social provider, required for connecting
     * @param  {Function} done      Call when done
     */
    Controller.prototype.connectTwitter = function(oModel, oProfiles, done) {
      var oProfile = {
        profile_id: this.getUserId(),
        id: oProfiles.twitter.id,
        display_name: oProfiles.twitter.displayName,
        username: oProfiles.twitter.username,
        linked: 'X'
      };

      // Do the create
      oModel.update("/TwitterProfiles('TESTUSER')", oProfile, {
        success: jQuery.proxy(function(oData, mResponse) {
          // Now we continue on to the Social stuff.
          if (done) { done(); }
        }, this),
        error: jQuery.proxy(function(mError) {
          this.maybeHandleAuthError(mError);
        }, this),
        async: true,
        merge: true
      });
    };

    /**
     * Connect up the Linkedin account
     * @param  {String}   sToken    Bearer token to use for jQuery call
     * @param  {String}   sProvider Social provider, required for connecting
     * @param  {Function} done      Call when done
     */
    Controller.prototype.connectLinkedin = function(oModel, oProfiles, done) {
      var oProfile = {
        profile_id: this.getUserId(),
        id: oProfiles.linkedin.id,
        email: oProfiles.linkedin.email,
        first_name: oProfiles.linkedin.firstname,
        last_name: oProfiles.linkedin.lastname,
        headline: oProfiles.linkedin.headline,
        linked: 'X'
      };

      // Do the create
      oModel.update("/LinkedInProfiles('TESTUSER')", oProfile, {
        success: jQuery.proxy(function(oData, mResponse) {
          // Now we continue on to the Social stuff.
          if (done) { done(); }
        }, this),
        error: jQuery.proxy(function(mError) {
          this.maybeHandleAuthError(mError);
        }, this),
        async: true,
        merge: true
      });
    };


    /**
     * Connect up the SCN account
     * @param  {String}   sToken    Bearer token to use for jQuery call
     * @param  {String}   sProvider Social provider, required for connecting
     * @param  {Function} done      Call when done
     */
    Controller.prototype.connectScn = function(oModel, oProfiles, done) {

    };

    /***
     *    ██╗     ██╗███╗   ██╗██╗  ██╗
     *    ██║     ██║████╗  ██║██║ ██╔╝
     *    ██║     ██║██╔██╗ ██║█████╔╝
     *    ██║     ██║██║╚██╗██║██╔═██╗
     *    ███████╗██║██║ ╚████║██║  ██╗
     *    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
     *
     */

    /**
     * Connect the profile
     * @param  {String} sToken    Auth token
     * @param  {String} sProvider Social provier name
     * @param  {Function} fnDone  Call when done
     * @param  {Function} fnError Call when error
     */
    Controller.prototype.linkProfiles = function(sToken, sProvider, fnDone, fnError) {
      var oModel = this.getView().getModel("profile");

      // This will authenticate us with a different user, however it is now
      // up to Node to match up the user with the original user...
      var oHeaders = {
        Authorization: 'Bearer ' + sToken
      };
      jQuery.ajax({
        url: '/auth/profile/merge/' + sProvider,
        type: 'POST',
        headers: oHeaders,
        data: {
          link: this.getLinkToken()
        },
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {

          // Clear link token - we won't need it again (root Util controller)
          this.clearLinkToken();

          // Reuse the connect function to link the social profile
          this.connect(sToken, sProvider, fnDone);
        }, this),
        error: jQuery.proxy(function(mError) {

          // Maybe handle an authentication issue?
          this.maybeHandleAuthError(mError);

          // Call our error handler
          if (fnError) { fnError(); }
        }, this)
      });
    };
  });
