jQuery.sap.declare("view.plans.Lite");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'view.plans.Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Lite = Controller.extend("view.plans.Lite", /** @lends view.plans.Lite.prototype */ {

	});

	/**
	 * On init handler
	 */
	Lite.prototype.onInit = function() {
		// Handle route matching.
		this.getRouter().getRoute("plans-free").attachPatternMatched(this._onRouteMatched, this);
	};

	/**
	 * On exit handler
	 */
	Lite.prototype.onExit = function() {};

	/**
	 * On before rendering; add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Lite.prototype.onBeforeRendering = function() {	};

	/**
	 * On after rendering - the DOM is now built. Add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Lite.prototype.onAfterRendering = function() {	};

	/**
	 * Route matched handler...
	 */
	Lite.prototype._onRouteMatched = function(oEvent) {

	};

	return Lite;

}, /* bExport= */ true);
