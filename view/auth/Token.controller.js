jQuery.sap.declare("view.auth.Token");

// Provides controller view. Token
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
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
     Token.prototype.onAfterRendering = function() { };

    /**
     * Route matched handler...
     * Currently, this only serves to swap between the two tabs of the login
     * page - sign in and register.
     */
     Token.prototype._onRouteMatched = function(oEvent) {
      // When the route is matched, we either want the login tab or
      // the register tab
      var oParameters = oEvent.getParameters();
      var oView = this.getView();

      // First, check if access_token is supplied. If so, we're authed
      // to go to dash
      if(oParameters.arguments.access_token) {
        this.getRouter().navTo("dash", {}, !sap.ui.Device.system.phone);
      } else {
        this.getRouter().navTo("login", {}, !sap.ui.Device.system.phone);
      }
    };

    return  Token;

  }, /* bExport= */ true);
