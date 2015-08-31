jQuery.sap.declare("view.auth.Controller");

// Provides controller util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/dash/util/Controller"],
  function(jQuery, UtilController) {
  "use strict";

  var Controller = UtilController.extend("view.auth.Controller", /** @lends view.auth.Controller */ {

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
    let oModel = this.getView().getModel("settings");

    // Read social stuff from node
    let bContinue = false;
    let oProfiles = {};
    let oHeaders = {
      Authorization: 'Bearer ' + sToken
    };
    jQuery.ajax({
      url: 'auth/api/profile',
      type: 'GET',
      headers: oHeaders,
      async: false,
      success: jQuery.proxy(function(oData, mResponse) {
        oProfiles = oData;
        bContinue = true;
      }, this),
      error: jQuery.proxy(function(mError) {

      }, this)
    })

    // Now, update their social profile
    // oProfiles should have a named array, matching the provider
    let fn = "_connect" + sProvider.charAt(0).toUpperCase() + sProvider.slice(1);
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
    // stub
  };

  /**
   * Connect up the Google account
   * @param  {[type]} oModel    [description]
   * @param  {[type]} oProfiles [description]
   * @return {[type]}           [description]
   */
  Controller.prototype._connectGoogle = function(oModel, oProfiles) {
    let oProfile = {
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
        let bContinue = true;
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
    let oProfile = {
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
        let bContinue = true;
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
    let oProfile = {
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
        let bContinue = true;
      }, this),
      error: jQuery.proxy(function(mError) {
        this._maybeHandleAuthError(mError);
      }, this),
      async: false,
      merge : true
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
     let oModel = this.getView().getModel("settings");

     // Read social stuff from node
     let bContinue = false;
     let oProfiles = {};

     // This will authenticate us with a different user, however it is now
     // up to Node to match up the user with the original user...
     let oHeaders = {
       Authorization: 'Bearer ' + sToken
     };
     jQuery.ajax({
       url: '/auth/profile/merge/' + sProvider,
       type: 'POST',
       headers: oHeaders,
       data : { link : this.getLinkToken() },
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
