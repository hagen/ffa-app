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
      oDialog.open();

      // When the route is matched, we either want the login tab or
      // the register tab
      var oParameters = oEvent.getParameters();
      let sRoute = "";

      // First, check if access_token is supplied. If so, we're authed
      // to go to dash
      if (oParameters.arguments.access_token) {

        // Firstly we handle authentication by checking if this user has the provider's
        // social profile listed against their name. If so, great move on.
        // If not, create the social profile then connect it to the user's
        // profile.
        this._handleTokenAuth(oParameters.arguments.access_token, oParameters.arguments.provider);

        // Now check if they have an active plan. If not, they will need to sign
        // up.
        if(this._hasPlan()) {
          sRoute = "dash";
        } else {
          sRoute = "plans";
        }
      } else {
        sRoute = "login";
      }

      oDialog.close();
      this.getRouter().navTo(sRoute, {}, !sap.ui.Device.system.phone);
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
      this.getView().getModel("profile").read("/SocialProfiles", {
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

      let bContinue = false;
      let sCustomerId = "";

      // Create braintree customer
      let oHeaders = {
        Authorization: 'Bearer ' + this.getBearerToken()
      };
      jQuery.ajax({
        url: '/payments/customer',
        type: 'POST',
        headers: oHeaders,
        data : { profileId : this.getUserId() },
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {
          sCustomerId = oData.customerId;
          bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
          bContinue = false;
        }, this)
      });

      // Continue?
      if (!bContinue) {
        return;
      }

      // Create HANA profile, with Braintree customerId
      let oModel = this.getView().getModel("profile");
      let oData = {
        id: this.getUserId(), // Controller function
        first_name: "",
        last_name: "",
        email: "",
        customer_id : sCustomerId,
        begda: new Date(Date.now()),
        endda: new Date("9999-12-31T23:59:59")
      };

      // Create the user
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

      this.getView().getModel("profile").read("/CurrentSubscriptions('TESTUSER')", {
        success : jQuery.proxy(function(oData, mResponse) {
          if (oData.profile_id) {
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
