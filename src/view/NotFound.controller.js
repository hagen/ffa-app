jQuery.sap.declare("com.ffa.hpc.view.NotFound");

sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/util/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var NotFound = Controller.extend("com.ffa.hpc.view.NotFound", /** @lends com.ffa.hpc.view.NotFound.prototype */ {

	});

	/////////////////////////////////////////////////////////////////////
	//
	// Page load/unload
	//
	/////////////////////////////////////////////////////////////////////

	/**
	 *
	 */
	NotFound.prototype.onInit = function() {

		this.getRouter().getRoute("catchallMaster").attachPatternMatched(this._onRouteMatched, this);
		this.getRouter().getRoute("catchallDetail").attachPatternMatched(this._onRouteMatched, this);
	};

	/**
	 *
	 */
	NotFound.prototype.onBeforeRendering = function() {};

	/**
	 *
	 */
	NotFound.prototype.onAfterRendering = function() {};

	/**
	 *
	 */
	NotFound.prototype.onExit = function() {};

	/**
	 * Route matched handler...
	 */
	NotFound.prototype._onRouteMatched = function(oEvent) {
		var oParameters = oEvent.getParameters();
		this.getRouter().navTo("dash", {}, !sap.ui.Device.system.phone);
	};

	/**
	 *
	 */
	NotFound.prototype.onBackPressed = function (oEvent) {
		this.getRouter().myNavBack("home", {});
	};

	return NotFound;

}, /* bExport= */ true);
