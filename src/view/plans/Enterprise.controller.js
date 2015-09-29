jQuery.sap.declare("view.plans.Enterprise");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'view/plans/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Enterprise = Controller.extend("view.plans.Enterprise", /** @lends view.plans.Enterprise.prototype */ {

	});

	/**
	 * On init handler
	 */
	Enterprise.prototype.onInit = function() {
		// Handle route matching.
		this.getRouter().getRoute("plan-enterprise").attachPatternMatched(this._onRouteMatched, this);
	};

	/**
	 * On exit handler
	 */
	Enterprise.prototype.onExit = function() {};

	/**
	 * On before rendering; add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Enterprise.prototype.onBeforeRendering = function() {	};

	/**
	 * On after rendering - the DOM is now built. Add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Enterprise.prototype.onAfterRendering = function() {	};

	/**
	 * Route matched handler...
	 */
	Enterprise.prototype._onRouteMatched = function(oEvent) {

	};

	return Enterprise;

}, /* bExport= */ true);
