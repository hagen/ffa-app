jQuery.sap.declare("com.ffa.hpc.view.forecasts.Workbench");

// Provides controller forecasts.Workbench
sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/util/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Workbench = Controller.extend("com.ffa.hpc.view.forecasts.Workbench", /** @lends com.ffa.hpc.view.forecasts.Workbench.prototype */ {

    });

    /**
     * On init handler
     */
    Workbench.prototype.onInit = function() {
      // Subscribe to the recents view event - we do this because if the user
      // has navigated directly to the recents listing without coming first to
      // the workbench, we need to make sure the Recents list item is selected.
      this.getEventBus().subscribe("Recents", "RouteMatched", this._handleRecentsRouteMatched, this);
      this.getEventBus().subscribe("Folders", "RouteMatched", this._handleFoldersRouteMatched, this);
      this.getEventBus().subscribe("Favorites", "RouteMatched", this._handleFavoritesRouteMatched, this);
      this.getEventBus().subscribe("Search", "RouteMatched", this._handleSearchRouteMatched, this);

      // handle route matched
      this.getRouter().getRoute("workbench").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Workbench.prototype.onExit = function() {};

    /**
     * Before rendering, set up required icons
     */
    Workbench.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Workbench.prototype.onAfterRendering = function() {;
    };

		/***
		 *    ███╗   ██╗ █████╗ ██╗   ██╗
		 *    ████╗  ██║██╔══██╗██║   ██║
		 *    ██╔██╗ ██║███████║██║   ██║
		 *    ██║╚██╗██║██╔══██║╚██╗ ██╔╝
		 *    ██║ ╚████║██║  ██║ ╚████╔╝
		 *    ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝
		 *
		 */
		/**
		 * Handles nav back press
		 * @param  {object} oEvent Button press event
		 */
		Workbench.prototype.onNavBackPress = function(oEvent) {
			this.getRouter().myNavBack("dash");
		};
		
    /***
     *    ██████╗  ██████╗ ██╗   ██╗████████╗███████╗███████╗
     *    ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔════╝
     *    ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ███████╗
     *    ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ╚════██║
     *    ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗███████║
     *    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚══════╝
     *
     */

    /**
     * Route matched handler for the workbench proper
     * There's a couple of cases to handle here:
     * (1) the user has no forecasts; show a message page.
     * (2) the user has forecasts - show the recent forecasts page
     * All other scenarios are handled by other routes
     * @param  {object} oEvent Route matched event
     */
    Workbench.prototype._onRouteMatched = function(oEvent) {
      this.checkMetaDataLoaded("forecast");
      // When the workbench route is matched, just load up recently used
      // immediately.
      this.getRouter().navTo("folders", {}, !sap.ui.Device.system.phone);
    };

    /**
     * Handles route matched for the recents view. This is only done so that the
     * correct Master List Item can be selected, if not already done.
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event description
     * @param  {object} oData    Object data payload
     */
    Workbench.prototype._handleRecentsRouteMatched = function(sChannel, sEvent, oData) {
      this.selectListItem("idRecentsListItem");
    };

    /**
     * Handles route matched for the Folders view. This is only done so that the
     * correct Master List Item can be selected, if not already done.
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event description
     * @param  {object} oData    Object data payload
     */
    Workbench.prototype._handleFoldersRouteMatched = function(sChannel, sEvent, oData) {
      this.selectListItem("idFoldersListItem");
    };

    /**
     * Handles route matched for the Favorites view. This is only done so that the
     * correct Master List Item can be selected, if not already done.
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event description
     * @param  {object} oData    Object data payload
     */
    Workbench.prototype._handleFavoritesRouteMatched = function(sChannel, sEvent, oData) {
      this.selectListItem("idFavoritesListItem");
    };

    /**
     * Handles route matched for the Search view. This is only done so that the
     * correct Master List Item can be selected, if not already done.
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event description
     * @param  {object} oData    Object data payload
     */
    Workbench.prototype._handleSearchRouteMatched = function(sChannel, sEvent, oData) {
      this.selectListItem("idSearchListItem");
    };

    /***
     *    ██╗     ██╗███████╗████████╗
     *    ██║     ██║██╔════╝╚══██╔══╝
     *    ██║     ██║███████╗   ██║
     *    ██║     ██║╚════██║   ██║
     *    ███████╗██║███████║   ██║
     *    ╚══════╝╚═╝╚══════╝   ╚═╝
     *
     */

    /**
     * When the All Forecasts list item is pressed, we nav to that. There is only
     * one recents list item, so it has a dedicated press handler.
     * @param  {object} oEvent Item pressed event
     */
    Workbench.prototype.onMasterListItemPress = function(oEvent) {
      var oItem = oEvent.getParameter("listItem");
      // Navigate to all forecasts
      this.getRouter().navTo(oItem.data("route"), {}, !sap.ui.Device.system.phone);
    };

    /**
     * Selects the static supplied list item
     * @param  {string} sId List item id
     */
    Workbench.prototype.selectListItem = function(sId) {
      var oItem = this.getView().byId(sId);
      if (!oItem.getSelected()) {
        oItem.setSelected(true);
      }
    };

    return Workbench;

  }, /* bExport= */ true);
