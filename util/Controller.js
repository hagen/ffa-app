jQuery.sap.declare("com.ffa.dash.util.Controller");

// Provides controller util.Controller
sap.ui.define(["jquery.sap.global", "sap/ui/core/mvc/Controller"],
  function(jQuery, MvcController) {
    "use strict";

    var Controller = MvcController.extend("com.ffa.dash.util.Controller", /** @lends com.ffa.dash.util.Controller */ {
      _loaded: false
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
    Controller.prototype._maybeHandleAuthError = function(mError) {
      if ([401, 400].indexOf(mError.response.statusCode) > -1) {
        // and now back to log-in
        this.getRouter().navTo("login", {
          tab: "signin",
          reason: "auth"
        }, !sap.ui.Device.system.phone);
      }
    };

    /**
     * Returns the Node User Id hash, which is stored in the 'user' JSON model
     * on app initialisation.
     * @return {String} User ID from Node
     */
    Controller.prototype.getUserId = function() {
      let mModel = this.getView().getModel("user");
      return (mModel ? mModel.getProperty("/userid") : "");
    };

    /**
     * Returns the bearer auth token stored in local storage.
     * @return {String} Bearer auth token
     */
    Controller.prototype.getBearerToken = function() {
      if (_token) {
        return _token;
      } else if (window.localStorage) {
        return window.localStorage.getItem('_token');
      } else {
        return "";
      }
    };

    /**
     * Stores the supplied link token in local storage, so that upon page
     * refresh, it is not lost.
     * @return {String} Link token
     */
    Controller.prototype.getLinkToken = function() {
      if (window.localStorage) {
        return window.localStorage.getItem('_link');
      } else {
        return "";
      }
    };

    /**
     * Removes the previously stored link token.
     */
    Controller.prototype.clearLinkToken = function() {
      if (window.localStorage) {
        window.localStorage.removeItem('_link');
      }
    };
    /***
     *    ███╗   ███╗███████╗████████╗ █████╗ ██████╗  █████╗ ████████╗ █████╗
     *    ████╗ ████║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗
     *    ██╔████╔██║█████╗     ██║   ███████║██║  ██║███████║   ██║   ███████║
     *    ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║  ██║██╔══██║   ██║   ██╔══██║
     *    ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║██████╔╝██║  ██║   ██║   ██║  ██║
     *    ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
     *
     */

    /**
     * Function to be called on all route matches that require login/auth.
     * This will check if the metadata model has been loaded, and if not redirect to login.
     * The assumption being that if the meta data model isn't loaded, then
     * the user is not authorised to continue.
     * @param  {String} sModel Model name to check meta data of
     */
    Controller.prototype._checkMetaDataLoaded = function(sModel) {
      if (this._loaded) {
        return;
      }

      // Collect the model matching that supplied.
      let mModel = this.getView().getModel(sModel);

      // If there's a metamodel, all good; if not, back to signin
      if (mModel) {
        if (!mModel.getServiceMetadata()) {
          window.location.href = "/#/login";
        } else {
          this._loaded = true;
        }
      } else {
        throw new Error("Invalid model name");
      }
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
     *    ██████╗ ██╗   ██╗███████╗██╗   ██╗
     *    ██╔══██╗██║   ██║██╔════╝╚██╗ ██╔╝
     *    ██████╔╝██║   ██║███████╗ ╚████╔╝
     *    ██╔══██╗██║   ██║╚════██║  ╚██╔╝
     *    ██████╔╝╚██████╔╝███████║   ██║
     *    ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝
     *
     */

    /**
     * Opens a busy dialog WITH title and text
     * @param  {object} oParams Object of parameters
     */
    Controller.prototype.openBusyDialog = function(oParams) {
      // Create the fragment and open!
      if (!this._oBusyDialog) {
        this._oBusyDialog = sap.ui.xmlfragment("idBusyDialogFragment", "view.BusyDialog", this);
        this.getView().addDependent(this._oBusyDialog);
      }

      // Set title, text and cancel event
      if(oParams) {
        this._oBusyDialog.setTitle(oParams.title);
        this._oBusyDialog.setText(oParams.text);
        if (typeof oParams.onCancel === 'function') {
          this._oBusyDialog.attachEvent('close', function(oEvent) {
            if (oEvent.getParameter("cancelPressed")) {
              oParams.onCancel();
            }
          });
        }

        // And cancel button?
        if (oParams.showCancelButton === undefined) {
          this._oBusyDialog.setShowCancelButton(false);
        } else {
          this._oBusyDialog.setShowCancelButton(oParams.showCancelButton);
        }
      }

      // now show the dialog
      this._oBusyDialog.open();
    };
    Controller.prototype.showBusyDialog = function(oParams) {
      this.openBusyDialog(oParams);
    };

    /**
     * Updates the open busy dialog with new text.
     * @param  {object} oParams Params containing only text
     */
    Controller.prototype.updateBusyDialog = function(oParams) {
      this._oBusyDialog.setText(oParams.text);
    };

    /**
     * Closes the busy dialog
     */
    Controller.prototype.closeBusyDialog = function(oParams) {
      if (this._oBusyDialog) {
        // now show the dialog
        this._oBusyDialog.close();
      }
    };
    Controller.prototype.hideBusyDialog = function(oParams) {
      this.closeBusyDialog(oParams);
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
    Controller.prototype._put = function(sKey, sValue) {
      let oStore = new jQuery.sap.storage(jQuery.sap.storage.Type.Local);
      oStore.put(sKey, sValue);
    };

    /**
     * [_get description]
     * @param  {[type]} sKey [description]
     * @return {[type]}      [description]
     */
    Controller.prototype._get = function(sKey) {
      let oStore = new jQuery.sap.storage(jQuery.sap.storage.Type.Local);
      return oStore.get(sKey);
    };
  });
