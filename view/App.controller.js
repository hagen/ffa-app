jQuery.sap.declare("view.App");
jQuery.sap.require("thirdparty.font-awesome.FontAwesomeIconPool");

// Provides controller view.App
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var App = Controller.extend("view.App", /** @lends view.App.prototype */ {

	});

	/**
	 * Initialisation of the App will initially result in a check on the
	 * device to decide if the app width is going to be limited.
	 * @return {[type]} [description]
	 */
	App.prototype.onInit = function() {};

	App.prototype.onExit = function() {};

	App.prototype.onBeforeRendering = function() {};

	App.prototype.onAfterRendering = function() {};

	return App;

}, /* bExport= */ true);
