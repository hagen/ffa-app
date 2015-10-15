jQuery.sap.declare("com.ffa.hpc.view.datasets.EditSheets");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/datasets/EditController"],
  function(jQuery, Controller) {
    "use strict";

    var Sheets = Controller.extend("com.ffa.hpc.view.datasets.EditSheets", /** @lends com.ffa.hpc.view.datasets.EditSheets.prototype */ {

    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    Sheets.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("edit-google").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Sheets.prototype.onExit = function() {};

    /**
     *
     */
    Sheets.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Sheets.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Sheets.prototype._onRouteMatched = function(oEvent) {
      this.checkMetaDataLoaded("dataset");
      var oParameters = oEvent.getParameters();

      // The dataset ID may not have been provided. If not, that's cool
      if (oParameters.arguments.dataset_id) {
        // retain the data set id
        this._sId = oParameters.arguments.dataset_id;

        // Bind the view to the data set Id
        var oPage = this.getView().byId("idSheetsPage");

        // Bind the destination page with the path and expand params
        oPage.bindElement("dataset>/DataSets('" + this._sId + "')", {
          expand: "Dimensions,Sheets"
        });
      }
    };

    /***
     *    ██████╗ ██╗   ██╗████████╗████████╗ ██████╗ ███╗   ██╗███████╗
     *    ██╔══██╗██║   ██║╚══██╔══╝╚══██╔══╝██╔═══██╗████╗  ██║██╔════╝
     *    ██████╔╝██║   ██║   ██║      ██║   ██║   ██║██╔██╗ ██║███████╗
     *    ██╔══██╗██║   ██║   ██║      ██║   ██║   ██║██║╚██╗██║╚════██║
     *    ██████╔╝╚██████╔╝   ██║      ██║   ╚██████╔╝██║ ╚████║███████║
     *    ╚═════╝  ╚═════╝    ╚═╝      ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝
     *
     */

    /**
     * Once the user is done editing, we'll validate the name they've given
     * their data set, and save any other changes
     * @param  {Event} oEvent Button press event
     */
    Sheets.prototype.onDonePress = function(oEvent) {

      // Easier
      var get = jQuery.proxy(this.getControl, this);
      var oButton = oEvent.getSource();

      // Validaty checks
      var oControl = get("idNameInput");
      if (!this._isValid(oControl, oControl.getValue().trim())) {
        return;
      }

      // Busy
      this.showBusyDialog({});

      // Try and update...
      var oModel = this.getView().getModel("dataset");
      var aBatch = [];

      // First change is for the name and the headers key
      aBatch.push(oModel.createBatchOperation("/DataSets('" + this._sId + "')", "MERGE", {
        name: get("idNameInput").getValue(),
      }));
      aBatch.push(oModel.createBatchOperation("/GoogleSheets('" + this._sId + "')", "MERGE", {
        title: get("idNameInput").getValue(),
        headers: (get("idHeadersCheckbox").getSelected() ? "X" : " ")
      }));

      // Build the dimensions batch requests, and add to our existing payload

      // Removed as per #14
      // we are no longer allowing change to data set schema
      //aBatch = aBatch.concat(this._createDimensionsBatch(oModel));

      // Add and Submit!
      oModel.addBatchChangeOperations(aBatch);
      oModel.submitBatch(
        // Success
        jQuery.proxy(function(oData, oResponse, aErrorResponses) {

          // Clear links
          while (this._aLinks.length > 0) {
            this._aLinks.pop();
          }
          this._oLink = null;

          // Nav Back
          this.getRouter().navTo("view-google", {
            dataset_id: this._sId
          }, !sap.ui.Device.system.phone);

          // Busy
          this.hideBusyDialog();
        }, this),
        // Error
        jQuery.proxy(function(oError) {

        }, this),
        true, /* bAsync */
        false /* bImportData */
      );
    };

    /**
     * Cancel editing. We need to return all controls to their original
     * values, and then nav back
     * @param  {Event} oEvent Button event
     */
    Sheets.prototype.onCancelPress = function(oEvent) {

      // Easier
      var get = jQuery.proxy(this.getControl, this);

      // Now we undo all the changes... first, the text input.
      var oControl = get("idNameInput");
      oControl.setValue(oControl.data("original"))
        .setValueState(sap.ui.core.ValueState.None)
        .setValueStateText("");

      // and the check box
      oControl = get("idHeadersCheckbox");
      oControl.setSelected(oControl.data("original") === "X");

      // The key input has it's value state text removed
      get("idKeyInput").setValueStateText("");

      // And the links
      this._aLinks.forEach(function(link, index) {
        // replace the link text with the original text
        link.setText(link.data("original"));
      }, this);

      // Clear links
      while (this._aLinks.length > 0) {
        this._aLinks.pop();
      }
      this._oLink = null;

      // Navigate backwards
      this.getRouter().navTo("view-google", {
        dataset_id: this._sId
      }, !sap.ui.Device.system.phone);
    };

    /***
     *    ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
     *    ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
     *    ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   ██║██║   ██║██╔██╗ ██║
     *    ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
     *     ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
     *      ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    /**
     * Some simple validation to check that a value was supplied for The
     * data set name
     * @param  {Event} oEvent Change event
     */
    Sheets.prototype.onNameInputChange = function(oEvent) {
      // Check that the value is not empty
      this._isValid(oEvent.getSource(), oEvent.getParameter("value").trim());
    };

    /**
     * Checks if the entered details are valid.
     * @return {Boolean} Valid?
     */
    Sheets.prototype._isValid = function(oInput, sValue) {

      var bValid = true;

      // Check that the value is not empty
      if (!sValue) {
        oInput.setValueState(sap.ui.core.ValueState.Error)
          .setValueStateText("Your data set will need a name!");
        bValid = false;
      } else {
        oInput.setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("");
        bValid = true;
      }

      return bValid;
    };

    return Sheets;

  }, /* bExport= */ true);
