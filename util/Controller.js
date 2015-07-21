jQuery.sap.declare("com.ffa.dash.util.Controller");

// Provides controller util.Controller
sap.ui.define(['jquery.sap.global','sap/ui/core/mvc/Controller'],
	function(jQuery, MvcController) {
	"use strict";

	var Controller = MvcController.extend("com.ffa.dash.util.Controller", /** @lends com.ffa.dash.util.Controller */ {

	});

	/**
	 * Returns the event bus
	 */
	Controller.prototype.getEventBus = function () {
		return this.getOwnerComponent().getEventBus();
	};

	/**
	 * Returns the router
	 */
	Controller.prototype.getRouter = function () {
		return sap.ui.core.UIComponent.getRouterFor(this);
	};

	/**
   * Returns a utc date
   * @param oDate
   * @returns {Date}
   */
	Controller.prototype._utc = function(oDate) {
		// Remove the time zone component
		var tzOffset = new Date(0).getTimezoneOffset()*60*1000;
		return new Date(oDate.getTime() + tzOffset);
  };

  /**
   * Returns a local date
   * @param oDate
   * @returns {Date}
   */
  Controller.prototype._local = function(oDate) {
		// Remove the time zone component
		var tzOffset = new Date(0).getTimezoneOffset()*60*1000;
		return new Date(oDate.getTime() - tzOffset);
  };

  /**
   * Returns a date with only date components, no time
   * @param oDate
   * @returns {Date}
   */
  Controller.prototype._date = function(oDate) {
		// Remove the time zone component
    	return new Date(new Date(oDate).setHours(0));
  };
});
