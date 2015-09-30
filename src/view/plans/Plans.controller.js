jQuery.sap.declare("com.ffa.hpc.view.plans.Plans");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/view/plans/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Plans = Controller.extend("com.ffa.hpc.view.plans.Plans", /** @lends com.ffa.hpc.view.plans.Plans.prototype */ {

    });

    /**
     * On init handler
     */
    Plans.prototype.onInit = function() {
      // Handle route matching.
      this.getRouter().getRoute("plans").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     * On exit handler
     */
    Plans.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Plans.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Plans.prototype.onAfterRendering = function() {
      jQuery.sap.require("com.ffa.hpc.thirdparty.spiders.Spiders");
    };

    /**
     * Route matched handler...
     */
    Plans.prototype._onRouteMatched = function(oEvent) {

    };

    /***
     *    ████████╗██╗██╗     ███████╗    ███████╗██╗   ██╗███████╗███╗   ██╗████████╗███████╗
     *    ╚══██╔══╝██║██║     ██╔════╝    ██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
     *       ██║   ██║██║     █████╗      █████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
     *       ██║   ██║██║     ██╔══╝      ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ╚════██║
     *       ██║   ██║███████╗███████╗    ███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║   ███████║
     *       ╚═╝   ╚═╝╚══════╝╚══════╝    ╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Handles tile press for any one of the available plans.
     * @param  {object} oEvent Tile press event object
     */
    Plans.prototype.onTilePress = function(oEvent) {

      // what's the bound index?
      var oTile = oEvent.getSource();
      var oContext = oTile.getBindingContext("profile");;

      // Bind dialog to correct plan
      var oDialog = this.getView().byId("idPlanDetailsDialog");
      oDialog.bindElement("profile>/PlanTypes('" + oContext.getProperty("id") + "')");

      // now show the dialog
      oDialog.open();
    };

    /***
     *    ██████╗ ██╗ █████╗ ██╗      ██████╗  ██████╗
     *    ██╔══██╗██║██╔══██╗██║     ██╔═══██╗██╔════╝
     *    ██║  ██║██║███████║██║     ██║   ██║██║  ███╗
     *    ██║  ██║██║██╔══██║██║     ██║   ██║██║   ██║
     *    ██████╔╝██║██║  ██║███████╗╚██████╔╝╚██████╔╝
     *    ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝
     *
     */

    /**
     * Dialog close button press
     * @param  {object} oEvent Button press event
     */
    Plans.prototype.onClosePress = function(oEvent) {
      this.getView().byId("idPlanDetailsDialog").close();
    };

    /**
     * Currently navigates to dash
     * @param  {object} oEvent Button press event
     */
    Plans.prototype.onGoPress = function(oEvent) {
      // What's our new plan?
      var sPlanId = oEvent.getSource().data("planType");
      // For new plans, nav straight away
      this.getRouter().navTo("plan-" + sPlanId, {}, !sap.ui.Device.system.phone);
    };

    return Plans;

  }, /* bExport= */ true);
