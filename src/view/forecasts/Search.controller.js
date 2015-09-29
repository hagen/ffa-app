jQuery.sap.declare("view.forecasts.Search");

// Provides controller forecasts.Recents
sap.ui.define(["jquery.sap.global", "view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Search = Controller.extend("view.forecasts.Search", /** @lends view.forecasts.Search.prototype */ {

    });

    /**
     * On init handler
     */
    Search.prototype.onInit = function() {
      this.getRouter().getRoute("search").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Search.prototype.onExit = function() {};

    /**
     * Before rendering, set up required icons
     */
    Search.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Search.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler for the workbench recent forecasts listing
     * @param  {object} oEvent Route matched event
     */
    Search.prototype._onRouteMatched = function(oEvent) {
  		this._checkMetaDataLoaded("forecast");
      // Firstly, we need to var the master know that the recent forecasts
      // route has been matched. Then it can select the recents list item for us
      // if this hasn't already been done.
      this.getEventBus().publish("Search", "RouteMatched", {} /*paylod*/ );

      // Every time we come here, update the search list, and remove everything
      try {
        this.getView().byId("idSearchList").setNoDataText("Enter search term");
      } catch (e) {}
    };

    /**
     * When the search button is pressed, we'll look for some forecasts.
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Search.prototype.onSearchPress = function (oEvent) {
      // Take the forecast search criteria and query forecasts
      var oInput = this.getView().byId("idSearchInput");
      var sSearch = oInput.getValue().trim();

      // if there's no search term, we can't really search!
      if (!sSearch) {
        oInput.setValueState(sap.ui.core.ValueState.Error);
        oInput.setValueStateText("Empty search value...");
        return;
      } else {
        oInput.setValueState(sap.ui.core.ValueState.None);
      }

      // Collect our list and create a new template to bind to
      var oList = this.getView().byId("idSearchList");
      var oListItem = new sap.m.StandardListItem({
        title : "{forecast>name}",
        infoState : sap.ui.core.ValueState.Success,
        type : sap.m.ListType.Navigation,
        info : "{forecast>DataSet/name}"
      });

      // bind the list to the search criteria...
      oList.bindItems({
        path : 'forecast>/Forecasts',
        parameters : {
          expand : "DataSet"
        },
        filters : [new sap.ui.model.Filter({
          path : 'tolower(name)',
          operator : sap.ui.model.FilterOperator.Contains,
          value1 : "'" + sSearch.toLowerCase() + "'" // So wierd
        }), new sap.ui.model.Filter({
          path : 'endda',
          operator : sap.ui.model.FilterOperator.EQ,
          value1 : '9999-12-31'
        }), new sap.ui.model.Filter({
          path : 'user',
          operator : sap.ui.model.FilterOperator.EQ,
          value1 : 'TESTUSER'
        })],
        template : oListItem
      });

      // When the list receives it's data, or not, rather, we set the
      // no data text to something more specific...
      var oBinding = oList.getBinding("items");
      oBinding.attachDataReceived(this._setSearchListNoDataTextNotFound, this);
    };

    /**
     * [_setSearchListNoDataTextNotFound description]
     */
    Search.prototype._setSearchListNoDataTextNotFound = function (oEvent) {
      // When we begin searching, its ok to update the not found text to something
      // more appropriate.
      this.getView().byId("idSearchList").setNoDataText("Nothing found");
    };

    /**
     * Clear the value state if there's now text in there.
     * @param  {Event} oEvent Change event
     */
    Search.prototype.onSearchChange = function (oEvent) {
      var sValue = oEvent.getParameter("value").trim();
      if (sValue.length > 0) {
        oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
      }
    };

    /**
     * Forecast tile is pressed. Time to navigate!
     * @param  {object} oEvent The tile press event
     */
    Search.prototype.onListItemPress = function(oEvent) {
      // Grab the tile so we can get it's type and id
      var oItem = oEvent.getParameter("listItem");
      var oContext = oItem.getBindingContext("forecast");
      var sId = oContext.getProperty("id");
      this.getRouter().navTo("forecast-from-search", {
        forecast_id: sId
      }, !sap.ui.Device.system.phone);
    };

    /**
     * Clears the search form and the results.
     * @param  {Event} oEvent Button press event
     */
    Search.prototype.onClearPress = function (oEvent) {
      // Clear the search results
      var oList = this.getView().byId("idSearchList");
      var oInput = this.getView().byId("idSearchInput");

      // Clear list binding
      var oBinding = oList.getBinding("items");
      oBinding.detachDataReceived(this._setSearchListNoDataTextNotFound, this);
      oBinding.filter([]);

      // Put the old no data text back
      oList.setNoDataText("Enter search term");

      // clear oInput
      oInput.setValue("");
    };
    
    return Search;

  }, /* bExport= */ true);
