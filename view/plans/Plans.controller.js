jQuery.sap.declare("view.plans.Plans");
jQuery.sap.require("thirdparty.spiders.Spiders");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
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

		// Initialise some icons!
		sap.ui.core.IconPool.addIcon("heart-o", "FontAwesome", { fontFamily: "FontAwesome", content: "f08a" });
		sap.ui.core.IconPool.addIcon("coffee", "FontAwesome", { fontFamily: "FontAwesome", content: "f0f4" });
		sap.ui.core.IconPool.addIcon("star", "FontAwesome", { fontFamily: "FontAwesome", content: "f005" });
		sap.ui.core.IconPool.addIcon("star-half-o", "FontAwesome", { fontFamily: "FontAwesome", content: "f123" });
		sap.ui.core.IconPool.addIcon("diamond", "FontAwesome", { fontFamily: "FontAwesome", content: "f219" });
		sap.ui.core.IconPool.addIcon("check-circle", "FontAwesome", { fontFamily: "FontAwesome", content: "f058" });
		sap.ui.core.IconPool.addIcon("database", "FontAwesome", { fontFamily: "FontAwesome", content: "f1c0" });
		sap.ui.core.IconPool.addIcon("calendar", "FontAwesome", { fontFamily: "FontAwesome", content: "f073" });
		sap.ui.core.IconPool.addIcon("life-ring", "FontAwesome", { fontFamily: "FontAwesome", content: "f1cd" });
		sap.ui.core.IconPool.addIcon("book", "FontAwesome", { fontFamily: "FontAwesome", content: "f02d" });
		sap.ui.core.IconPool.addIcon("code", "FontAwesome", { fontFamily: "FontAwesome", content: "f121" });
		sap.ui.core.IconPool.addIcon("usd", "FontAwesome", { fontFamily: "FontAwesome", content: "f155" });
		sap.ui.core.IconPool.addIcon("cloud", "FontAwesome", { fontFamily: "FontAwesome", content: "f0c2" });
		sap.ui.core.IconPool.addIcon("lock", "FontAwesome", { fontFamily: "FontAwesome", content: "f023" });
		sap.ui.core.IconPool.addIcon("exclamation-circle", "FontAwesome", { fontFamily: "FontAwesome", content: "f06a" });
		sap.ui.core.IconPool.addIcon("cogs", "FontAwesome", { fontFamily: "FontAwesome", content: "f085" });

		// And load up the static data model...
		this._mPlans = new sap.ui.model.json.JSONModel("models/plans.json");
	};

	/**
	 * On exit handler
	 */
	Plans.prototype.onExit = function() {};

	/**
	 * On before rendering; add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Plans.prototype.onBeforeRendering = function() {
		this.getView().setModel(this._mPlans, "plans");
	};

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
		if(!this._oDetailsDialog) {
			this._oDetailsDialog = sap.ui.xmlfragment("idPlanDetailsFragment", "view.plans.DetailsDialog", this);
			this.getView().addDependent(this._oDetailsDialog);
		}

		// what's the bound index?
		var oTile = oEvent.getSource();
		var ix = oTile.getParent().indexOfAggregation("tiles", oTile);

		// Bind to the correct index of the plans JSON model
		var sPath = "plans>/" + ix;

		// Bind dialog to correct plan
		this._oDetailsDialog.bindElement(sPath);

		// now show the dialog
		this._oDetailsDialog.open();
	};

	/**
	 * Dialog close button press
	 * @param  {object} oEvent Button press event
	 */
	Plans.prototype.onPlansFreeClosePress = function(oEvent) {
		this._oDetailsDialog.close();
	};

	/**
	 * Currently navigates to dash
	 * @param  {object} oEvent Button press event
	 */
	Plans.prototype.onPlanDetailsGoPress = function(oEvent) {
		this.getRouter().navTo("dash", {}, !sap.ui.Device.system.phone);
	};

	return Plans;

}, /* bExport= */ true);
