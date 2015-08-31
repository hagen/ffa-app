jQuery.sap.declare("view.plans.Free");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'view/plans/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Free = Controller.extend("view.plans.Free", /** @lends view.plans.Free.prototype */ {

	});

	/**
	 * On init handler
	 */
	Free.prototype.onInit = function() {
		// Handle route matching.
		this.getRouter().getRoute("plan-free").attachPatternMatched(this._onRouteMatched, this);
	};

	/**
	 * On exit handler
	 */
	Free.prototype.onExit = function() {};

	/**
	 * On before rendering; add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Free.prototype.onBeforeRendering = function() {	};

	/**
	 * On after rendering - the DOM is now built. Add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Free.prototype.onAfterRendering = function() {	};

	/**
	 * Route matched handler...
	 */
	Free.prototype._onRouteMatched = function(oEvent) {

	};

	return Free;

}, /* bExport= */ true);
