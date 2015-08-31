jQuery.sap.declare("view.plans.Plans");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'view/plans/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Plans = Controller.extend("view.plans.Plans", /** @lends view.plans.Plans.prototype */ {

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
	Plans.prototype.onBeforeRendering = function() { };

	/**
	 * On after rendering - the DOM is now built. Add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Plans.prototype.onAfterRendering = function() {
		jQuery.sap.require("thirdparty.spiders.Spiders");
	};

	/**
	 * Route matched handler...
	 */
	Plans.prototype._onRouteMatched = function(oEvent) {

	};

	/**
	 * Handles tile press for any one of the available plans.
	 * @param  {object} oEvent Tile press event object
	 */
	Plans.prototype.onPlansTilePress = function(oEvent) {

		// what's the bound index?
		let oTile = oEvent.getSource();
		let oContext = oTile.getBindingContext("settings");;

		// Bind dialog to correct plan
		let oDialog =	this.getView().byId("idPlanDetailsDialog");
		oDialog.bindElement("settings>/PlanTypes('" + oContext.getProperty("id") + "')");

		// now show the dialog
		oDialog.open();
	};

	/**
	 * Dialog close button press
	 * @param  {object} oEvent Button press event
	 */
	Plans.prototype.onPlansFreeClosePress = function(oEvent) {
		let oDialog =	this.getView().byId("idPlanDetailsDialog").close();
	};

	/**
	 * Currently navigates to dash
	 * @param  {object} oEvent Button press event
	 */
	Plans.prototype.onPlanDetailsGoPress = function(oEvent) {
		let sType = oEvent.getSource().data("planType");
		this.getRouter().navTo("plan-" + sType, {}, !sap.ui.Device.system.phone);
	};

	return Plans;

}, /* bExport= */ true);
