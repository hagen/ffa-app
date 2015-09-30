jQuery.sap.declare("com.ffa.hpc.view.settings.About");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/settings/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var About = Controller.extend("com.ffa.hpc.view.settings.About", /** @lends com.ffa.hpc.view.settings.About.prototype */ {

    });

    /**
     *
     */
    About.prototype.onInit = function() {
      // handle route matched
      this.getRouter().getRoute("about").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    About.prototype.onExit = function() {};

    /**
     *
     */
    About.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    About.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    About.prototype._onRouteMatched = function(oEvent) {

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("About", "RouteMatched", {} /* payload */ );
    };

    return About;

  }, /* bExport= */ true);
