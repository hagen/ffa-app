jQuery.sap.declare("view.Plans");
jQuery.sap.require("thirdparty.spiders.Spiders");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Plans = Controller.extend("view.Plans", /** @lends view.Plans.prototype */ {

	});

	/**
	 * On init handler
	 */
	Plans.prototype.onInit = function() {
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
	Plans.prototype.onBeforeRendering = function() {
	};

	/**
	 * On after rendering - the DOM is now built. Add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Plans.prototype.onAfterRendering = function() {};

	/**
	 * Route matched handler...
	 */
	Plans.prototype._onRouteMatched = function(oEvent) {

	};

	return Plans;

}, /* bExport= */ true);
