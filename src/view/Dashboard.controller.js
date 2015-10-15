jQuery.sap.declare("com.ffa.hpc.view.Dashboard");

// Provides controller view.Dashboard
sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/util/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Dashboard = Controller.extend("com.ffa.hpc.view.Dashboard", /** @lends com.ffa.hpc.view.Dashboard.prototype */ {

    });

    /**
     * On init handler
     */
    Dashboard.prototype.onInit = function() {
      // handle route matched
      this.getRouter().getRoute("dash").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     * On exit handler
     */
    Dashboard.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Dashboard.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Dashboard.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler...
     */
    Dashboard.prototype._onRouteMatched = function(oEvent) {
      this.checkMetaDataLoaded("forecast");
      var oParameters = oEvent.getParameters();
      var oView = this.getView();
    };

    /**
     * Navigation to application settings
     * @param  {object} oEvent button event object
     */
    Dashboard.prototype.onSettingsPress = function(oEvent) {
      // Nav.
      this.getRouter().navTo("profile", {}, !sap.ui.Device.system.phone);
    };

    /**
     * Navigation to the forecast workbench. Hooray!
     * @param  {object} oEvent button event object
     */
    Dashboard.prototype.onForecastsTilePress = function(oEvent) {
      // Now we can nav to the detail page.
      this.getRouter().navTo("workbench", {}, !sap.ui.Device.system.phone);
    };

    /**
     * Navigation to data workbench
     * @param  {object} oEvent button event object
     */
    Dashboard.prototype.onDatasetsTilePress = function(oEvent) {
      // Now we can nav to the detail page.
      this.getRouter().navTo("datasets", {}, !sap.ui.Device.system.phone);
    };

    /**
     * Navigation to data workbench
     * @param  {object} oEvent button event object
     */
    Dashboard.prototype.onAlogrithmsTilePress = function(oEvent) {
      // Now we can nav to the detail page.
      this.getRouter().navTo("functions", {}, !sap.ui.Device.system.phone);
    };

    return Dashboard;

  }, /* bExport= */ true);
