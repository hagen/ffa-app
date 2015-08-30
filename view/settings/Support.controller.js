jQuery.sap.declare("view.settings.Support");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/NewDataSetController"],
  function(jQuery, Controller) {
    "use strict";

    var Support = Controller.extend("view.settings.Support", /** @lends view.settings.Support.prototype */ {

    });

    /**
     *
     */
    Support.prototype.onInit = function() {
      // handle route matched
      this.getRouter().getRoute("support").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Support.prototype.onExit = function() {};

    /**
     *
     */
    Support.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Support.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Support.prototype._onRouteMatched = function(oEvent) {

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("Support", "RouteMatched", {} /* payload */ );
    };

    return Support;

  }, /* bExport= */ true);
