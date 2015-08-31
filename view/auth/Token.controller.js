jQuery.sap.declare("view.auth.Token");

// Provides controller view. Token
sap.ui.define(['jquery.sap.global', 'view/auth/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Token = Controller.extend("view.auth.Token", /** @lends view.auth.Token.prototype */ {

    });

    /**
     * On init handler
     */
    Token.prototype.onInit = function() {
      this.getRouter().getRoute("token").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     * On exit handler
     */
    Token.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Token.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Token.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler...
     * Currently, this only serves to swap between the two tabs of the login
     * page - sign in and register.
     */
    Token.prototype._onRouteMatched = function(oEvent) {
      let oDialog = this.getView().byId("idBusyDialog");
      jQuery.sap.delayedCall(0, this, function() {oDialog.open()}, []);

      // When the route is matched, we either want the login tab or
      // the register tab
      var oParameters = oEvent.getParameters();
      let sRoute = "";

      // First, check if access_token is supplied. If so, we're authed
      // to go to dash
      if (oParameters.arguments.access_token) {
        this._handleTokenAuth(oParameters.arguments.access_token, oParameters.arguments.provider);
        if(this._hasPlan()) {
          sRoute = "dash";
        } else {
          sRoute = "plans";
        }
      } else {
        sRoute = "login";
      }

      this.getRouter().navTo(sRoute, {}, !sap.ui.Device.system.phone);
      oDialog.close();
    };

    /***
     *     █████╗ ██╗   ██╗████████╗██╗  ██╗
     *    ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
     *    ███████║██║   ██║   ██║   ███████║
     *    ██╔══██║██║   ██║   ██║   ██╔══██║
     *    ██║  ██║╚██████╔╝   ██║   ██║  ██║
     *    ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
     *
     */

    /**
     * Decides whether we need to create a user in the back-end; this is all
     * run synchronously. The user must wait.
     * @param  {[type]} sToken    The auth bearer token to use for requests to Node.js
     * @param  {[type]} sProvider The provider we're authenticating against.
     */
    Token.prototype._handleTokenAuth = function(sToken, sProvider) {
      // If nothing is returned, then we need to create the user.
      if (!this._hasSocialProfile()) {
        // Create the user
        this._create(sToken, sProvider);
      }

      // and connect it to social
      this._connect(sToken, sProvider);
    };

    /**
     * Reads in the user's social profile
     * @return {[type]} [description]
     */
    Token.prototype._hasSocialProfile = function() {
      let oProfile = {};

      // Testuser will be replaced by proxy
      this.getView().getModel("settings").read("/SocialProfiles", {
        filters : [new sap.ui.model.Filter({
          path : 'profile_id',
          operator : sap.ui.model.FilterOperator.EQ,
          value1 : 'TESTUSER' // Replaced
        })],
        success: jQuery.proxy(function(oData, mResponse) {
          oProfile = oData;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false
      });

      // Do they have any social profile results?
      return !(oProfile.results.length === 0);
    };

    /**
     * Create the user
     * @param  {[type]} sToken [description]
     * @return {[type]}        [description]
     */
    Token.prototype._create = function(sToken, sProvider) {
      let oModel = this.getView().getModel("settings");
      let oData = {
        id: this.getUserId(), // Controller function
        first_name: "",
        last_name: "",
        email: "",
        begda: new Date(Date.now()),
        endda: new Date("9999-12-31T23:59:59")
      };

      // Create the user
      let bContinue = false;
      oModel.create("/Profiles", oData, {
        success: jQuery.proxy(function(oData, mResponse) {
          // Now we continue on to the Social stuff.
          bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false
      });

      // Continue?
      if (!bContinue) {
        return;
      }
    };

    /***
     *    ██████╗ ██╗      █████╗ ███╗   ██╗███████╗
     *    ██╔══██╗██║     ██╔══██╗████╗  ██║██╔════╝
     *    ██████╔╝██║     ███████║██╔██╗ ██║███████╗
     *    ██╔═══╝ ██║     ██╔══██║██║╚██╗██║╚════██║
     *    ██║     ███████╗██║  ██║██║ ╚████║███████║
     *    ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝
     *
     */

    /**
     * Checks if this user has a valid usage plan
     * @return {Boolean} [description]
     */
    Token.prototype._hasPlan = function () {

      let bValid = false;

      this.getView().getModel("settings").read("/Plans('TESTUSER')", {
        success : jQuery.proxy(function(oData, mResponse) {
          if (oData.id) {
            bValid = true;
          } else {
            bValid = false;
          }
        }, this),
        error : jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
          bValid = false;
        }, this),
        async : false
      });

      return bValid;
    };
    
    return Token;

  }, /* bExport= */ true);
