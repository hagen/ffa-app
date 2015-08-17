jQuery.sap.declare("view.forecasts.Recents");

// Provides controller forecasts.Recents
sap.ui.define(["jquery.sap.global", "com/ffa/dash/view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Recents = Controller.extend("view.forecasts.Recents", /** @lends view.forecasts.Recents.prototype */ {

    });

    /**
     * On init handler
     */
    Recents.prototype.onInit = function() {
      this.getRouter().getRoute("recents").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Recents.prototype.onExit = function() {};

    /**
     * Before rendering, set up required icons
     */
    Recents.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Recents.prototype.onAfterRendering = function() {;
    };

    /**
     * Route matched handler for the workbench recent forecasts listing
     * @param  {object} oEvent Route matched event
     */
    Recents.prototype._onRouteMatched = function(oEvent) {
      // Firstly, we need to let the master know that the recent forecasts
      // route has been matched. Then it can select the recents list item for us
      // if this hasn't already been done.
      this.getEventBus().publish("Recents", "RouteMatched", {} /*paylod*/ );

      // Show the recent forecasts in a tile container.
      this._showRecents();
    };

    /**
     * Given a tile container to render in, this function renders recent forecasts
     * for the user into the tile container. Note, if there are no forecasts to show,
     * we won't bother.
     */
    Recents.prototype._showRecents = function() {
      // Grab our message page, as we will either be showing or hiding it
      var bVisible = true;
			var oTileContainer = this.getView().byId("idRecentForecastsTileContainer");

      // Filters
      var aFilters = [new sap.ui.model.Filter({
        path: "user",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: "TESTUSER"
      })];

      // If we have forecasts, bind the tile container
      if (this._hasRecents(aFilters)) {

				var oTemplate = new sap.m.StandardTile({
					title: "{forecast>name}",
					info: "{forecast>DataSet/name}",
					number: "{forecast>horizon}",
					numberUnit: "{= ${forecast>horizon} === 1 ? 'day' : 'days' }",
					icon: "sap-icon://line-chart",
          type: sap.m.StandardTileType.None,
          press: jQuery.proxy(this.onTilePress, this) // be careful with this template
            // press event - you must wrap in Proxy, otherwise
            // this refers to the tile.
				});

        // Bind tile container
        oTileContainer.bindAggregation("tiles", {
          path: "forecast>/Forecasts",
          parameters: {
            expand: "DataSet,Runs"
          },
          filters: aFilters,
          sorter: [new sap.ui.model.Sorter({
            path: "name",
            descending: false
          })],
          template: oTemplate
        });

        // hide message page
        bVisible = false;
      } else {
        // Show the no forecasts page
        bVisible = true;
      }

      // Message page
      var oMessagePage = this.getView().byId(sap.ui.core.Fragment.createId("idRecentsNoForecastsFragment", "idWorkbenchMessagePage"));
      oMessagePage.setVisible(bVisible);
			oTileContainer.setVisible(!bVisible);
    };

    /**
     * Does this user have any forecasts we can list here?
     * @return {boolean} Has forecasts or not?
     */
    Recents.prototype._hasRecents = function(aFilters) {
      // if the user has forecasts, nav to recents.
      return this.hasForecasts(aFilters);
    };

    /**
     * Forecast tile is pressed. Time to navigate!
     * @param  {object} oEvent The tile press event
     */
    Recents.prototype.onTilePress = function(oEvent) {
      // Grab the tile so we can get it's type and id
      var oTile = oEvent.getSource();
      var oContext = oTile.getBindingContext("forecast");
      var sId = oContext.getProperty("id");
      this.getRouter().navTo("forecast-from-recents", {
        forecast_id: sId
      }, !sap.ui.Device.system.phone);
    };

    return Recents;

  }, /* bExport= */ true);
