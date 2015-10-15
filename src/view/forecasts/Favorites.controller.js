jQuery.sap.declare("com.ffa.hpc.view.forecasts.Favorites");

// Provides controller forecasts.Favorites
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Favorites = Controller.extend("com.ffa.hpc.view.forecasts.Favorites", /** @lends com.ffa.hpc.view.forecasts.Favorites.prototype */ {

    });

    /**
     * On init handler
     */
    Favorites.prototype.onInit = function() {
      this.getRouter().getRoute("favorites").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Favorites.prototype.onExit = function() {};

    /**
     * Before rendering, set up required icons
     */
    Favorites.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Favorites.prototype.onAfterRendering = function() {;
    };

    /**
     * Route matched handler for the workbench recent forecasts listing
     * @param  {object} oEvent Route matched event
     */
    Favorites.prototype._onRouteMatched = function(oEvent) {
  		this.checkMetaDataLoaded("forecast");
      // Firstly, we need to var the master know that the recent forecasts
      // route has been matched. Then it can select the recents list item for us
      // if this hasn't already been done.
      this.getEventBus().publish("Favorites", "RouteMatched", {} /*paylod*/ );

      // Show the favorite forecasts in a tile container.
      this._showFavorites();
    };

    /**
     * Given a tile container to render in, this function renders recent forecasts
     * for the user into the tile container. Note, if there are no forecasts to show,
     * we won't bother.
     */
    Favorites.prototype._showFavorites = function() {
      // Grab our message page, as we will either be showing or hiding it
      var bVisible = true;
      var oTileContainer = this.getView().byId("idFavoritesTileContainer");

      // Filters
      var aFilters = [new sap.ui.model.Filter({
        path: "user",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: "TESTUSER"
      }),new sap.ui.model.Filter({
        path: "favorite",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: "X"
      })];

      // If we have forecasts, bind the tile container
      if (this._hasFavorites(aFilters)) {

        var oTemplate = new sap.m.StandardTile({
          title: "{forecast>name}",
          info: "{forecast>DataSet/name}",
          number: "{forecast>horizon}",
          numberUnit: "{= ${forecast>horizon} === 1 ? 'day' : 'days' }",
          icon: "sap-icon://favorite",
          press: jQuery.proxy(function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("forecast");
            var sId = oContext.getProperty("id");
            this.runForecast(sId);
          }, this)
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
      var oMessagePage = this.getView().byId("idMessagePage");
      oMessagePage.setVisible(bVisible);
			oTileContainer.setVisible(!bVisible);
    };

    /**
     * Does this user have any favorite forecasts we can list here?
     * Use the parent controller function to check.
     * @param   {Array}   aFilters  Filters
     * @return {boolean}  Has forecasts or not?
     */
    Favorites.prototype._hasFavorites = function(aFilters) {
      // if the user has forecasts, nav to recents.
      return this.hasForecasts(aFilters);
    };

    return Favorites;

  }, /* bExport= */ true);
