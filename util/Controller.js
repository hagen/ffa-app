jQuery.sap.declare("com.ffa.dash.util.Controller");

// Provides controller util.Controller
sap.ui.define(["jquery.sap.global", "sap/ui/core/mvc/Controller"],
  function(jQuery, MvcController) {
    "use strict";

    var Controller = MvcController.extend("com.ffa.dash.util.Controller", /** @lends com.ffa.dash.util.Controller */ {

    });

    /**
     * Returns the event bus
     */
    Controller.prototype.getEventBus = function() {
      return this.getOwnerComponent().getEventBus();
    };

    /**
     * Returns the router
     */
    Controller.prototype.getRouter = function() {
      return sap.ui.core.UIComponent.getRouterFor(this);
    };

    /***
     *     █████╗ ██╗   ██╗████████╗██╗  ██╗
     *    ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
     *    ███████║██║   ██║   ██║   ███████║
     *    ██╔══██║██║   ██║   ██║   ██╔══██║
     *    ██║  ██║╚██████╔╝   ██║   ██║  ██║
     *    ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
     *
     */

    /**
     * Generic auth handler for all Odata requests. If a 401 is returned,
     * user must log in again.
     * @param  {[type]} mError [description]
     * @return {[type]}        [description]
     */
    Controller.prototype._maybeHandleAuthError = function (mError) {
      if([401, 400].indexOf(mError.response.statusCode) > -1) {
        // and now back to log-in
        this.getRouter().navTo("login", {
          tab: "signin",
          reason : "auth"
        }, !sap.ui.Device.system.phone);
      }
    };

    Controller.prototype.getUserId = function () {
      let mModel = this.getView().getModel("user");
      return (mModel ? mModel.getProperty("/userid") : "");
    };
    /***
     *     █████╗ ██╗     ███████╗██████╗ ████████╗███████╗
     *    ██╔══██╗██║     ██╔════╝██╔══██╗╚══██╔══╝██╔════╝
     *    ███████║██║     █████╗  ██████╔╝   ██║   ███████╗
     *    ██╔══██║██║     ██╔══╝  ██╔══██╗   ██║   ╚════██║
     *    ██║  ██║███████╗███████╗██║  ██║   ██║   ███████║
     *    ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Simple MessageBox error
     */
    Controller.prototype.showErrorAlert = function(sMessage, sTitle, bCompact) {
      jQuery.sap.require("sap.m.MessageBox");
      sap.m.MessageBox.alert(sMessage, {
        icon: sap.m.MessageBox.Icon.ERROR,
        title: (sTitle ? sTitle : "Alert"),
        actions: [sap.m.MessageBox.Action.CLOSE],
        styleClass: bCompact ? "sapUiSizeCompact" : ""
      });
    };

    /**
     * Simple MessageBox info alert
     */
    Controller.prototype.showInfoAlert = function(sMessage, sTitle, bCompact) {
      jQuery.sap.require("sap.m.MessageBox");
      sap.m.MessageBox.show(sMessage, {
        icon: sap.m.MessageBox.Icon.INFORMATION,
        title: (sTitle ? sTitle : "Information"),
        actions: [sap.m.MessageBox.Action.OK],
        styleClass: bCompact ? "sapUiSizeCompact" : ""
      });
    };

    /**
     * Simple MessageBox success alert
     */
    Controller.prototype.showSuccessAlert = function(sMessage, sTitle, bCompact) {
      jQuery.sap.require("sap.m.MessageBox");
      sap.m.MessageBox.show(sMessage, {
        icon: sap.m.MessageBox.Icon.SUCCESS,
        title: (sTitle ? sTitle : "Success"),
        actions: [sap.m.MessageBox.Action.CLOSE],
        styleClass: bCompact ? "sapUiSizeCompact" : ""
      });
    };

    /***
     *    ██████╗  █████╗ ████████╗███████╗███████╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔════╝
     *    ██║  ██║███████║   ██║   █████╗  ███████╗
     *    ██║  ██║██╔══██║   ██║   ██╔══╝  ╚════██║
     *    ██████╔╝██║  ██║   ██║   ███████╗███████║
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝
     *
     */

    /**
     * Returns a utc date
     * @param oDate
     * @returns {Date}
     */
    Controller.prototype._utc = function(oDate) {
      // Remove the time zone component
      var tzOffset = new Date(0).getTimezoneOffset() * 60 * 1000;
      return new Date(oDate.getTime() + tzOffset);
    };

    /**
     * Returns a local date
     * @param oDate
     * @returns {Date}
     */
    Controller.prototype._local = function(oDate) {
      // Remove the time zone component
      var tzOffset = new Date(0).getTimezoneOffset() * 60 * 1000;
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

    /**
     * Returns a date with only date components, no time
     * @param oDate
     * @returns {Date}
     */
    Controller.prototype._string = function(dDate) {
      // If pattern wasn't supplied, use default
      var sPattern = "dd/MM/yyyy";

      // Need SAP formatter
      jQuery.sap.require("sap.ui.core.format.DateFormat");

      // Create the Date Formatter
      var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
        pattern: sPattern
      });
      return dateFormat.format(new Date(dDate.getTime()));
    };

    /***
     *    ███████╗████████╗ ██████╗ ██████╗  █████╗  ██████╗ ███████╗
     *    ██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝ ██╔════╝
     *    ███████╗   ██║   ██║   ██║██████╔╝███████║██║  ███╗█████╗
     *    ╚════██║   ██║   ██║   ██║██╔══██╗██╔══██║██║   ██║██╔══╝
     *    ███████║   ██║   ╚██████╔╝██║  ██║██║  ██║╚██████╔╝███████╗
     *    ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
     *
     */
    /**
     * [_put description]
     * @param  {[type]} sKey   [description]
     * @param  {[type]} sValue [description]
     * @return {[type]}        [description]
     */
    Controller.prototype._put = function (sKey, sValue) {
      let oStore = new jQuery.sap.storage(jQuery.sap.storage.Type.Local);
      oStore.put(sKey, sValue);
    };

    /**
     * [_get description]
     * @param  {[type]} sKey [description]
     * @return {[type]}      [description]
     */
    Controller.prototype._get = function (sKey) {
      let oStore = new jQuery.sap.storage(jQuery.sap.storage.Type.Local);
      return oStore.get(sKey);
    };
  });
