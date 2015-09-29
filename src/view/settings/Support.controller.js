jQuery.sap.declare("view.settings.Support");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/settings/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Support = Controller.extend("view.settings.Support", /** @lends view.settings.Support.prototype */ {
      _mArticles : new sap.ui.model.json.JSONModel({})
    });

    /**
     *
     */
    Support.prototype.onInit = function() {
      // handle route matched
      this.getRouter().getRoute("support").attachPatternMatched(this._onRouteMatched, this);
      this._mArticles.attachRequestCompleted({}, this.handleSearchCompleted, this);
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

      // Every time we come here, update the search list, and remove everything
      try {
        this.getView().byId("idSearchList").setNoDataText("Enter search term");
      } catch (e) {}

      // Supply the model to this view
      this.getView().setModel(this._mArticles, "article");
    };

    /**
     * When the search button is pressed, we'll look for some forecasts.
     * @param  {[type]} oEvent [description]
     */
    Support.prototype.onSearchPress = function (oEvent) {
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

      // Articles model, sourced from Zendesk
      this._mArticles.loadData("https://forefrontanalytics.zendesk.com/api/v2/help_center/articles/search.json?query=" + sSearch);
      this.getView().byId("idSearchList").setBusy(true);
    };

    /**
     * When the AJAX search is completed, we'll update the listing with results
     * @param  {[type]} oEvent [description]
     */
    Support.prototype.handleSearchCompleted = function (oEvent) {
      // Collect our list and create a new template to bind to
      var oList = this.getView().byId("idSearchList");
      var oListItem = new sap.m.StandardListItem({
        title : "{article>title}",
        infoState : sap.ui.core.ValueState.Success,
        type : sap.m.ListType.Navigation,
        info : "{article>label_names}",
        counter : "{article>vote_sum}"
      });

      // bind the list to the search criteria...
      oList.bindItems({
        path : "article>/results",
        template : oListItem
      });

      oList.setBusy(false);
    };

    /**
     * When a KB article is pressed, we will open in a new window. This takes the
     * user straight to the Forefront Support Desk
     * @param  {[type]} oEvent [description]
     */
    Support.prototype.onListItemPress = function (oEvent) {
      var oItem = oEvent.getParameter("listItem");
      var oContext = oItem.getBindingContext("article");

      // now take the html_url, and open a new browser window
      window.open(oContext.getProperty("html_url"));
    };

    /**
     * Clears the search form and the results.
     * @param  {Event} oEvent Button press event
     */
    Support.prototype.onClearPress = function (oEvent) {

      // Clear the search results
      var oList = this.getView().byId("idSearchList");
      var oInput = this.getView().byId("idSearchInput");

      // Put the old no data text back
      oList.setNoDataText("Enter search term");
      oList.destroyItems();

      // clear oInput
      oInput.setValue("");
    };

    return Support;

  }, /* bExport= */ true);
