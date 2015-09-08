jQuery.sap.declare("view.settings.Menu");

// Provides controller view.DataSets
sap.ui.define(["jquery.sap.global", "view/settings/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Menu = Controller.extend("view.settings.Menu", /** @lends view.settings.Menu.prototype */ {

    });

    /**
     * On init handler
     */
    Menu.prototype.onInit = function() {
      this.getEventBus().subscribe("Profile", "RouteMatched", this._handleProfileRouteMatched, this);
      this.getEventBus().subscribe("Social", "RouteMatched", this._handleSocialRouteMatched, this);
      this.getEventBus().subscribe("Account", "RouteMatched", this._handleAccountRouteMatched, this);
      this.getEventBus().subscribe("Support", "RouteMatched", this._handleSupportRouteMatched, this);
      this.getEventBus().subscribe("About", "RouteMatched", this._handleAboutRouteMatched, this);

      // handle route matched
      this.getRouter().getRoute("profile").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Menu.prototype.onExit = function() {};

    /**
     *
     */
    Menu.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Menu.prototype.onAfterRendering = function() {;
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
    Menu.prototype.onNavHomePress = function(oEvent) {
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
     * Route matched handler...
     * When matching the route of a data set, we only need to know the data set
     * Id in order to figure out what type of dataset it is.
     */
    Menu.prototype._onRouteMatched = function(oEvent) {
      this._checkMetaDataLoaded("profile");
      this.getRouter().navTo("profile", {}, !sap.ui.Device.system.phone);
    };

		/**
     *
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event description
     * @param  {object} oData    Object data payload
     */
    Menu.prototype._handleProfileRouteMatched = function(sChannel, sEvent, oData) {
      this.selectListItem("idProfileListItem");
    };

    /**
     *
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event description
     * @param  {object} oData    Object data payload
     */
    Menu.prototype._handleSocialRouteMatched = function(sChannel, sEvent, oData) {
      this.selectListItem("idSocialListItem");
    };

    /**
     *
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event description
     * @param  {object} oData    Object data payload
     */
    Menu.prototype._handleAccountRouteMatched = function(sChannel, sEvent, oData) {
      this.selectListItem("idAccountListItem");
    };

    /**
     * .
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event description
     * @param  {object} oData    Object data payload
     */
    Menu.prototype._handleSupportRouteMatched = function(sChannel, sEvent, oData) {
      this.selectListItem("idSupportListItem");
    };

    /**
     *
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event description
     * @param  {object} oData    Object data payload
     */
    Menu.prototype._handleAboutRouteMatched = function(sChannel, sEvent, oData) {
      this.selectListItem("idAboutListItem");
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
		  * Selects the static supplied list item
		  * @param  {string} sId List item id
		  */
		 Menu.prototype.selectListItem = function(sId) {
		 	var oItem = this.getView().byId(sId);
		 	if (!oItem.getSelected()) {
		 		oItem.setSelected(true);
		 	}
		 };

    /**
     * When a list item is pressed, we'll navigate to the route embedded in
     * it's 'route' custom data
     * @param  {object} oEvent Item pressed event
     */
    Menu.prototype.onListItemPress = function(oEvent) {
      // If the oItem is already selected, then don't re-select/and re navigate
      let sRoute = oEvent.getParameter("listItem").data("route");

      // Nav
      this.getRouter().navTo(sRoute, {}, !sap.ui.Device.system.phone);
    };

    /**
     * On press, the user will be logged out and their bearer token will
     * be destroyed.
     * @param  {[type]} oEvent [description]
     */
    Menu.prototype.onLogoutPress = function(oEvent) {
      // destroy bearer token
      _token = "";
      if (window.localStorage) {
        try {
          window.localStorage.removeItem("_token");
        } catch (e) {
          // dunno. Can't access localStorage
        }
      }
      // redirect to logout
      window.location.href = "/auth/logout";
    };

    return Menu;

  }, /* bExport= */ true);
