jQuery.sap.declare("view.forecasts.Controller");

// Provides controller util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/dash/util/Controller"],
function(jQuery, UtilController) {
  "use strict";

  var Controller = UtilController.extend("view.forecasts.Controller", /** @lends view.forecasts.Controller */ {
    _aForecasts: [],
    _aBatchOps: []
  });

  /***
   *    ███████╗ ██████╗ ██████╗ ███████╗ ██████╗ █████╗ ███████╗████████╗███████╗
   *    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝
   *    █████╗  ██║   ██║██████╔╝█████╗  ██║     ███████║███████╗   ██║   ███████╗
   *    ██╔══╝  ██║   ██║██╔══██╗██╔══╝  ██║     ██╔══██║╚════██║   ██║   ╚════██║
   *    ██║     ╚██████╔╝██║  ██║███████╗╚██████╗██║  ██║███████║   ██║   ███████║
   *    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝
   *
   */
  /**
   * Queries OData backend for forecasts matching filter criteria.
   * @param  {Array} aFilters Array of fitlers
   * @return {boolean}          Result
   */
  Controller.prototype.hasForecasts = function(aFilters) {

    // Query OData for any forecasts matching the supplied filters
    var bForecasts = false;
    this.getView().getModel("forecast").read("/Forecasts", {
      filters: aFilters,
      success: function(oData, mResponse) {
        if (oData.results.length > 0) {
          bForecasts = true;
        }
      },
      async: false
    });

    // return result
    return bForecasts;
  };

  /**
   * Reads in the forecast; if cached on the client, it is reused,
   * otherwise the cache is refreshed with a read from oData.
   * @param  {string} 	sId				Forecast ID
   * @param  {boolean} 	bRefresh 	Force refresh
   * @return {object}			  			Forecast object
   */
  Controller.prototype.getForecast = function(sId, bRefresh) {
    // Do the read and return
    var oForecast = this._aForecasts[sId];

    // if I already have this forecast, return it.
    if (oForecast && !bRefresh) {
      return oForecast;
    }

    // Otherwise read in the forecast.
    this.getView().getModel("forecast").read("/Forecasts('" + sId + "')", {
      success: function(oData, mResponse) {
        oForecast = oData;
      },
      async: false
    });

    return oForecast;
  };

  /***
   *    ███████╗ ██████╗ ██╗     ██████╗ ███████╗██████╗ ███████╗
   *    ██╔════╝██╔═══██╗██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
   *    █████╗  ██║   ██║██║     ██║  ██║█████╗  ██████╔╝███████╗
   *    ██╔══╝  ██║   ██║██║     ██║  ██║██╔══╝  ██╔══██╗╚════██║
   *    ██║     ╚██████╔╝███████╗██████╔╝███████╗██║  ██║███████║
   *    ╚═╝      ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝
   *
   */

  /**
   * Get the folder details.
   * @param  {string}  The folder id
   * @return {object/boolean} Folder object
   */
  Controller.prototype.getFolder = function(sId) {
    var oModel = this.getView().getModel("forecast");
    var sPath = "/Folders('" + sId + "')";

    // Is this folder in the model?
    var oFolder = oModel.getProperty(sPath);
    if (!oFolder) {
      this.getView().getModel("forecast").read(sPath, {
        success: function(oData, mResponse) {
          if (oData.id.length > 0) {
            oFolder = oData;
            // and we may as well make sure the folder object is now in the model
            oModel.setProperty(sPath, oFolder);
          }
        },
        async: false
      });
    }

    // return the folder object :)
    return oFolder;
  };

  /**
   * Get this folder's parent
   * @param  {string}  The folder id
   * @return {object/boolean} Folder parent
   */
  Controller.prototype.getParent = function(sId) {
    var oModel = this.getView().getModel("forecast");
    var sPath = "/Folders('" + sId + "')/Parent";
    var oParent = false;

    // This should be tidied to check if the parent is in the model
    oModel.read(sPath, {
      success: function(oData, mResponse) {
        if (oData.id.length > 0) {
          oParent = oData;
          // and we may as well make sure the folder object is now in the model
          oModel.setProperty("/Folders('" + oParent.id + "')", oParent);
        }
      },
      async: false
    });

    // if the folder has a parent, return true
    return oParent;
  };

  /**
   * Does this folder have any parents?
   * @param  {string}  The folder id
   * @return {boolean} Has forecasts or not?
   */
  Controller.prototype.hasParent = function(sId) {
    return (this.getParent(sId) === false ? false : true);
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
     this._oBusyDialog.setTitle(oParams.title);
     this._oBusyDialog.setText(oParams.text);
     if (typeof oParams.onCancel === 'function') {
       this._oBusyDialog.attachEvent('close', function(oEvent) {
         if(oEvent.getParameter("cancelPressed")) {
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
});
