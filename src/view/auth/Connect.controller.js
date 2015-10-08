jQuery.sap.declare("com.ffa.hpc.view.auth.Connect");

// Provides controller view. Connect
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/auth/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Connect = Controller.extend("com.ffa.hpc.view.auth.Connect", /** @lends com.ffa.hpc.view.auth.Connect.prototype */ {});

    /**
     * On init handler
     */
    Connect.prototype.onInit = function() {
      this.getRouter().getRoute("connect").attachPatternMatched(this.onRouteMatched, this);
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
    Connect.prototype.onRouteMatched = function(oEvent) {
      var self = this;
      this.showBusyDialog({});

      // When the route is matched, we either want the login tab or
      // the register tab
      var oParameters = oEvent.getParameters();
      var oRouter = this.getRouter();

      // First, check if access_token is supplied. If so, we're authed
      // to go to dash
      if (oParameters.arguments.access_token) {
        this.handleConnectAuth(
          oParameters.arguments.access_token,
          oParameters.arguments.provider,
          function() {
            oRouter.navTo("social", {}, !sap.ui.Device.system.phone);
            self.showBusyDialog({});
          },
          function() {
            oRouter.navTo("login", {}, !sap.ui.Device.system.phone);
            self.showBusyDialog({});
          }
        );
      }
    };

    /**
     * Decides whether we need to create a user in the back-end; this is all
     * run synchronously. The user must wait.
     * @param  {[type]} sToken    The auth bearer token to use for requests to Node.js
     * @param  {[type]} sProvider   The provider we're authenticating against.
     */
    Connect.prototype.handleConnectAuth = function(sToken, sProvider, done, error) {

      // If nothing is returned, then we need to create the user.
      this.linkProfiles(sToken, sProvider, done, error);
    };

    return Connect;

  }, /* bExport= */ true);
