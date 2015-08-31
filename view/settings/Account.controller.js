jQuery.sap.declare("view.settings.Account");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "com/ffa/dash/util/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Account = Controller.extend("view.settings.Account", /** @lends view.settings.Account.prototype */ {

    });

    /**
     *
     */
    Account.prototype.onInit = function() {
      // handle route matched
      this.getRouter().getRoute("account").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Account.prototype.onExit = function() {};

    /**
     *
     */
    Account.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Account.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Account.prototype._onRouteMatched = function(oEvent) {

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("Account", "RouteMatched", {} /* payload */ );
    };

    return Account;

  }, /* bExport= */ true);
