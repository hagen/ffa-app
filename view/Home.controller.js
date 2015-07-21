jQuery.sap.declare("view.Home");
jQuery.sap.require("thirdparty.spiders.Spiders");

// Provides controller view.Home
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Home = Controller.extend("view.Home", /** @lends view.Home.prototype */ {

	});

	/**
	 * On init handler
	 */
	Home.prototype.onInit = function() {
		//this.getRouter().getRoute("home").attachPatternMatched(this._onRouteMatched, this);
	};

	/**
	 * On exit handler
	 */
	Home.prototype.onExit = function() {};

	/**
	 * On before rendering; add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Home.prototype.onBeforeRendering = function() {
	};

	/**
	 * On after rendering - the DOM is now built. Add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Home.prototype.onAfterRendering = function() {};

	return Home;

}, /* bExport= */ true);
