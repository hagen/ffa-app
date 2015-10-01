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
     * Connect the profile
     * @param  {[type]} sToken  [description]
     * @param  {[type]} sProvider [description]
     * @return {[type]}           [description]
     */
    Controller.prototype._connect = function(sToken, sProvider) {
      var oModel = this.getView().getModel("profile");

      // Read social stuff from node
      var bContinue = false;
      var oProfiles = {};
      var oHeaders = {
        Authorization: 'Bearer ' + sToken
      };
      jQuery.ajax({
        url: '/auth/api/profile',
        type: 'GET',
        headers: oHeaders,
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {
          oProfiles = oData;
          bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {

        }, this)
      });

      // Now, update their social profile
      // oProfiles should have a named array, matching the provider
      var fn = "_connect" + sProvider.charAt(0).toUpperCase() + sProvider.slice(1);
      if (typeof this[fn] === "function") {
        this[fn].apply(this, [oModel, oProfiles]);
      }
    };

    /**
     * Connect up the Linkedin account
     * @param  {[type]} oModel    [description]
     * @param  {[type]} oProfiles [description]
     * @return {[type]}           [description]
     */
    Controller.prototype._connectLocal = function(oModel, oProfiles) {
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
          var bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false,
        merge: true
      });
    };

    /**
     * Connect up the Google account
     * @param  {[type]} oModel    [description]
     * @param  {[type]} oProfiles [description]
     * @return {[type]}           [description]
     */
    Controller.prototype._connectGoogle = function(oModel, oProfiles) {
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
          var bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false,
        merge: true
      });
    };

    /**
     * Connect up the Twitter account
     * @param  {[type]} oModel    [description]
     * @param  {[type]} oProfiles [description]
     * @return {[type]}           [description]
     */
    Controller.prototype._connectTwitter = function(oModel, oProfiles) {
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
          var bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false,
        merge: true
      });
    };

    /**
     * Connect up the Linkedin account
     * @param  {[type]} oModel    [description]
     * @param  {[type]} oProfiles [description]
     * @return {[type]}           [description]
     */
    Controller.prototype._connectLinkedin = function(oModel, oProfiles) {
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
          var bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false,
        merge: true
      });
    };


    /**
     * Connect up the SCN account
     * @param  {[type]} oModel    [description]
     * @param  {[type]} oProfiles [description]
     * @return {[type]}           [description]
     */
    Controller.prototype._connectScn = function(oModel, oProfiles) {

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
     * @param  {[type]} sToken  [description]
     * @param  {[type]} sProvider [description]
     * @return {[type]}           [description]
     */
    Controller.prototype._link = function(sToken, sProvider) {
      var oModel = this.getView().getModel("profile");

      // Read social stuff from node
      var bContinue = false;
      var oProfiles = {};

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
          bContinue = true;
          this.clearLinkToken();
        }, this),
        error: jQuery.proxy(function(mError) {
          bContinue = false;
        }, this)
      })

      // Reuse the connect function to link the social profile
      this._connect(sToken, sProvider);
    };
  });
