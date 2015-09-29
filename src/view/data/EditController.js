jQuery.sap.declare("view.data.EditController");
jQuery.sap.require("thirdparty.shortid.ShortId");

// Provides controller util.Controller
sap.ui.define(["jquery.sap.global", "view/data/Controller"],
  function(jQuery, DataController) {
    "use strict";

    var Controller = DataController.extend("view.data.EditController", /** @lends view.data.EditController */ {
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

      // update the link text to read the new type
      var l = this._oLink;
      l.data("original", l.getText());
      l.setText(oItem.getText());

      // we're going to store the selected type for saving later.
      this._aLinks.push(l);

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

    /**
     * handles value change for input controls. Only checks that the field
     * is populated, then clears the error state.
     * @param  {Event} oEvent Change event
     */
    Controller.prototype.onInputChange = function(oEvent) {
      var sValue = oEvent.getParameter("value");
      var oControl = oEvent.getSource();

      if (sValue) {
        oControl.setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("");
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
     * Builds a batch request using the supplied
     * @param  {Model} oModel OData Model
     * @return {Array}        Batch operations
     */
    Controller.prototype._createDimensionsBatch = function(oModel) {

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
