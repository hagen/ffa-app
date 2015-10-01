jQuery.sap.declare("com.ffa.hpc.view.data.CreateController");
jQuery.sap.require("com.ffa.hpc.thirdparty.shortid.ShortId");

// Provides controller com.ffa.hpc.util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/data/Controller"],
  function(jQuery, DataController) {
    "use strict";

    var Controller = DataController.extend("com.ffa.hpc.view.data.CreateController", /** @lends com.ffa.hpc.view.data.CreateController */ {
      _sId: "",
      _oLink: null,
      _aLinks: []
    });

    /***
     *    ██████╗ ███████╗███████╗██╗███╗   ██╗██╗████████╗██╗ ██████╗ ███╗   ██╗
     *    ██╔══██╗██╔════╝██╔════╝██║████╗  ██║██║╚══██╔══╝██║██╔═══██╗████╗  ██║
     *    ██║  ██║█████╗  █████╗  ██║██╔██╗ ██║██║   ██║   ██║██║   ██║██╔██╗ ██║
     *    ██║  ██║██╔══╝  ██╔══╝  ██║██║╚██╗██║██║   ██║   ██║██║   ██║██║╚██╗██║
     *    ██████╔╝███████╗██║     ██║██║ ╚████║██║   ██║   ██║╚██████╔╝██║ ╚████║
     *    ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    /**
     * On press, first check if we're in edit mode, and then display the definition
     * listing pop-up.
     * @param  {Event} oEvent Link press event
     */
    Controller.prototype.onDefinitionLinkPress = function(oEvent) {

      // Otherwise, we can show the definition pop-up and go from there.
      if (!this._oDefinitionDialog) {
        this._oDefinitionDialog = sap.ui.xmlfragment("idDataTypeFragment", "com.ffa.hpc.view.data.DimensionDataTypeDialog", this);
        this.getView().addDependent(this._oDefinitionDialog);
      }

      // Now bind the dialog to our dimension
      this._oLink = oEvent.getSource();

      // Set the select key... binding didn't work
      var sId = this._oLink.getBindingContext("dataset").getProperty("id");
      var sType = this._oLink.getText().toLowerCase();
      var oSelectList = sap.ui.core.Fragment.byId("idDataTypeFragment", "idDimensionDataTypeSelectList")
        .setSelectedKey(sType);

      // Open
      this._oDefinitionDialog.open();
    };

    /**
     * When the select item is pressed, this triggers a temporary storage of The
     * value, ready for updating when the user hits done.
     * @param  {event} oEvent Button press event
     */
    Controller.prototype.onTypeSelectChanged = function(oEvent) {

      var oItem = oEvent.getParameter("selectedItem");

      // update the link text to read the new type; ensure the original type is
      // retained
      var l = this._oLink;
      l.setText(oItem.getText());
      var oContext = l.getBindingContext("dataset");
      var oModel = oContext.getModel();
      oModel.setProperty("type", oItem.getText().toLowerCase(), oContext, true);
      if (oModel.hasPendingChanges()) {
        oModel.submitChanges();
      }

      // Close the dialog
      this.onTypeDialogClose(null);
    };

    /**
     * Closes the dialog
     * @param  {Event} oEvent Button press event
     */
    Controller.prototype.onTypeDialogClose = function(oEvent) {
      // Close
      if (this._oDefinitionDialog) {
        this._oDefinitionDialog.close();
      }
    };

    /***
     *    ███████╗ █████╗ ██╗   ██╗███████╗
     *    ██╔════╝██╔══██╗██║   ██║██╔════╝
     *    ███████╗███████║██║   ██║█████╗
     *    ╚════██║██╔══██║╚██╗ ██╔╝██╔══╝
     *    ███████║██║  ██║ ╚████╔╝ ███████╗
     *    ╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝
     *
     */

    /**
     * Grab the select item from the definition table, and make sure it is of
     * type Date. If not, then prompt the user to select. Note, we are comparing
     * the text of the Link control within the table's row items, as this is
     * a true reflection of the intended field type
     * @param {Function} fnCallback The callback for success
     */
    Controller.prototype.saveDateField = function(fnCallback) {
      var oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idFieldsFragment", "idFieldsTable")
      );

      // get the selected item, and check its type is Date
      var aItems = oTable.getSelectedItems() || [];
      if (aItems.length < 1) {
        this.showErrorAlert(
          "You must first select a Date field before continuing",
          "Select date field",
          sap.ui.Device.system.phone
        );
      }

      // else, we deal with the first item only
      var oRow = aItems[0];

      // use the item's text to check, as the item may have changed type before
      // saving, and we haven't yet persisted to the model. The link Control
      // is the second in the list of items
      var aCells = oRow.getCells();
      var sType = "";
      aCells.forEach(function(control, index) {
        if (control instanceof sap.m.Link) {
          sType = control.getText().toLowerCase();
          return;
        }
      }, this);

      // Now we have the type. Let's make sure it's Date
      if (sType !== 'date') {
        this.showErrorAlert(
          "The selected field is not of type Date. Please only select fields marked as type Date",
          "Invalid Date field",
          sap.ui.Device.system.phone
        );
      }

      // Now we save the date field...
      var sPath = "/Dimensions('" + oRow.getBindingContext("dataset").getProperty("id") + "')";
      var oModel = this.getView().getModel("dataset").update(sPath, { is_date : "X" }, {
        merge : true,
        async : true,
        success : fnCallback,
        error : jQuery.proxy(function(mError) {
          // hide busy
          this.hideBusyDialog();

          // show error Alert
          this.showErrorAlert(
            "Yijes. There was a problem saving your data set. I have no more information for you.",
            "Error saving data set",
            sap.ui.Device.system.phone
          );

          // maybe handle auth error
          this._maybeHandleAuthError(mError);
        }, this)
      });
    };

    /***
     *    ██████╗ ███████╗██╗     ███████╗████████╗███████╗
     *    ██╔══██╗██╔════╝██║     ██╔════╝╚══██╔══╝██╔════╝
     *    ██║  ██║█████╗  ██║     █████╗     ██║   █████╗
     *    ██║  ██║██╔══╝  ██║     ██╔══╝     ██║   ██╔══╝
     *    ██████╔╝███████╗███████╗███████╗   ██║   ███████╗
     *    ╚═════╝ ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Deletes a recently created data set
     * @param  {String} sId [description]
     * @param  {Deferred} oPromise [description]
     */
    Controller.prototype.delete = function(sId, oPromise) {
      if(!sId) {
        return;
      }
      this.getView().getModel("dataset").remove("/DataSets('" + sId + "')", {
        success: jQuery.proxy(function(oData, mResponse) {
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {
          oPromise.resolve();
        }, this)
      });
    };
  });
