jQuery.sap.declare("view.NotFound");

sap.ui.define(['jquery.sap.global', 'com/ffa/ppo/util/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var NotFound = Controller.extend("view.NotFound", /** @lends view.NotFound.prototype */ { 
		
	});
	
	/////////////////////////////////////////////////////////////////////
	//
	// Page load/unload
	//
	/////////////////////////////////////////////////////////////////////
	
	/**
	 * 
	 */
	NotFound.prototype.onInit = function() {};
	
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
	 * 
	 */
	NotFound.prototype.onBackPressed = function (oEvent) {
		this.getRouter().myNavBack("home", {});
	};
	
	return NotFound;
	
}, /* bExport= */ true);