jQuery.sap.declare("view.data.CreateController");
jQuery.sap.require("thirdparty.shortid.ShortId");

// Provides controller util.Controller
sap.ui.define(["jquery.sap.global", "view/data/Controller"],
  function(jQuery, DataController) {
    "use strict";

    var Controller = DataController.extend("view.data.CreateController", /** @lends view.data.CreateController */ {
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
        this._oDefinitionDialog = sap.ui.xmlfragment("idDataTypeFragment", "view.data.DimensionDataTypeDialog", this);
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
      if (!l.data("original")) {
        l.data("original", l.getText());
      }
      l.setText(oItem.getText());

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
     *    ██████╗  █████╗ ████████╗ ██████╗██╗  ██╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║  ██║
     *    ██████╔╝███████║   ██║   ██║     ███████║
     *    ██╔══██╗██╔══██║   ██║   ██║     ██╔══██║
     *    ██████╔╝██║  ██║   ██║   ╚██████╗██║  ██║
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
     *
     */

    /**
     * Grab the select item from the definition table, and make sure it is of
     * type Date. If not, then prompt the user to select. Note, we are comparing
     * the text of the Link control within the table's row items, as this is
     * a true reflection of the intended field type
     * @return {Boolean} Is a date field selected?
     */
    Controller.prototype.isDateSelected = function() {
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
        return false;
      }

      // else, we deal with the first item only
      var oItem = aItems[0];

      // use the item's text to check, as the item may have changed type before
      // saving, and we haven't yet persisted to the model. The link Control
      // is the second in the list of items
      var aItems = oItem.getItems()[1].getText().toLowerCase();
      var sType = "";
      aItems.forEach(function(control, index) {
        if (control instanceof sap.m.Link) {
          sType = control.getText().toLowerCase();
          return;
        }
      }, this);

      // Now we have the type. Let's make sure it's Date
      if (sType !== 'date') {
        this.showErrorAlert(
          "The selected field is not of type Date. Please only select fields marked as Date type",
          "Invalid Date field",
          sap.ui.Device.system.phone
        );
        return false;
      }

      // All good, return happy
      return true;
    };

    /**
     * Firstly, we take any changes to the types of the fields in the table, by
     * checking their CustomData for an 'original' key. If found, this field
     * needs it's type updated to the value in the Link text
     * @param  {Function} fnSuccess Success callback
     * @param  {Function} fnError   Error callback
     */
    Controller.prototype.saveDimensions = function(fnSuccess, fnError) {


    };

    /**
     * Builds a batch request using the supplied
     * @param  {Model} oModel OData Model
     * @return {Array}        Batch operations
     */
    Controller.prototype.createDimensionsBatch = function(oModel) {

      // Collect batch requests
      var aBatch = [];

      // And the links...
      this._aLinks.forEach(function(link, index) {
        var sType = link.data("original");
        if (sType) {
          var sId = link.getBindingContext("dataset").getProperty("id"); // Dimension Id
          aBatch.push(oModel.createBatchOperation("/Dimensions('" + sId + "')", "MERGE", {
            type: link.getText().toLowerCase()
          }));
        }
      }, this);

      return aBatch;
    };
  });
