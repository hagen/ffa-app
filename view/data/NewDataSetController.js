jQuery.sap.declare("view.data.NewDataSetController");
// Require the short Id gen library
jQuery.sap.require("thirdparty.shortid.ShortId");

// Provides controller util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/dash/util/Controller"],
  function(jQuery, UtilController) {
    "use strict";

    var Controller = UtilController.extend("view.data.NewDataSetController", /** @lends view.data.NewDataSetController */ {

    });

    /**
     * Opens a busy dialog WITH title and text
     * @param  {object} oParams Object of parameters
     */
    Controller.prototype.openBusyDialog = function(oParams) {
      // Create the fragment and open!
      var oDialog = sap.ui.core.Fragment.byId("idDataSetBusyDialogFragment", "idBusyDialog");
      if (!oDialog) {
        oDialog = sap.ui.xmlfragment("idDataSetBusyDialogFragment", "view.BusyDialog", this);
      }

      // Does this view have a copy of this dialog?
      if(!this._oBusyDialog) {
        this._oBusyDialog = oDialog;
        this.getView().addDependent(this._oBusyDialog);
      }

      // Set title, text and cancel event
      this._oBusyDialog.setTitle(oParams.title);
      this._oBusyDialog.setText(oParams.text);
      if (typeof oParams.onClose !== 'undefined') {
        this._oBusyDialog.onClose(oParams.onClose);
      }

      // now show the dialog
      this._oBusyDialog.open();
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

  });
