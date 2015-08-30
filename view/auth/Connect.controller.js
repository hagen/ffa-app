jQuery.sap.declare("view.auth.Connect");

// Provides controller view. Connect
sap.ui.define(['jquery.sap.global', 'view/auth/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Connect = Controller.extend("view.auth.Connect", /** @lends view.auth.Connect.prototype */ {
    });

    /**
     * On init handler
     */
    Connect.prototype.onInit = function() {
      this.getRouter().getRoute("connect").attachPatternMatched(this._onRouteMatched, this);
      //this.getRouter().getRoute("disconnect").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     * On exit handler
     */
    Connect.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Connect.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Connect.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler...
     * Currently, this only serves to swap between the two tabs of the login
     * page - sign in and register.
     */
    Connect.prototype._onRouteMatched = function(oEvent) {
      let oDialog = this.getView().byId("idBusyDialog");
      oDialog.open();

      // When the route is matched, we either want the login tab or
      // the register tab
      var oParameters = oEvent.getParameters();

      // First, check if access_token is supplied. If so, we're authed
      // to go to dash
      if (oParameters.arguments.access_token) {
        this._handleConnectAuth(oParameters.arguments.access_token, oParameters.arguments.provider);
      } else {
        this.getRouter().navTo("login", {}, !sap.ui.Device.system.phone);
      }
      oDialog.close();
    };

    /**
     * Decides whether we need to create a user in the back-end; this is all
     * run synchronously. The user must wait.
     * @param  {[type]} sToken    The auth bearer token to use for requests to Node.js
     * @param  {[type]} sProvider   The provider we're authenticating against.
     */
    Connect.prototype._handleConnectAuth = function(sToken, sProvider) {

      // If nothing is returned, then we need to create the user.
      this._link(sToken, sProvider);

      // We need to check if this user has the related social profile
      this.getRouter().navTo("dash", {}, !sap.ui.Device.system.phone);
    };

    return Connect;

  }, /* bExport= */ true);
