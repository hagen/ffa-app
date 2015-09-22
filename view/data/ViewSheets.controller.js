jQuery.sap.declare("view.data.ViewSheets");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Sheets = Controller.extend("view.data.ViewSheets", /** @lends view.data.ViewSheets.prototype */ {
      _editMode : false,
      _oLink : null,
      _aLinks : []
    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    Sheets.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("view-google").attachPatternMatched(this._onRouteMatched, this);
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
      this._checkMetaDataLoaded("dataset");
      var oParameters = oEvent.getParameters();

      // The dataset ID may not have been provided. If not, that's cool
      if (oParameters.arguments.dataset_id) {
        // retain the data set id
        this._sId = oParameters.arguments.dataset_id;

        // raise an event for the master page to select the correct list item
        this.getEventBus().publish("Master", "SelectItem", {
          dataset_id: this._sId
        });

        // Bind the view to the data set Id
        var oPage = this.getView().byId("idSheetsPage");

        // Bind the destination page with the path and expand params
        oPage.bindElement("dataset>/DataSets('" + this._sId + "')", {
          expand: "Dimensions,Sheets"
        });

        // We need a small model to control link display in the definition
        this._mSelect = new sap.ui.model.json.JSONModel({ subtle : true, emphasized : false });
        this.getView().setModel(this._mSelect, "select");
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
     * Start editing. For Google Sheets, the sheet id cannot be changed. This is
     * too dangerous, as there could be numerous forecasts, and datasets using
     * it. Only the name and the type listing are editable.
     * @param  {Event} oEvent Button press event
     */
    Sheets.prototype.onEditPress = function(oEvent) {

      // Enter edit mode
      this._editMode = true;

      // Easier
      var get = jQuery.proxy(this.getControl, this);

      // We'll make the Name editable.
      get("idNameInput").setEnabled(this._editMode);
      get("idHeadersCheckbox").setEnabled(this._editMode);

      // The Key input doesn't become editable, but there is a message
      // to advise why it's not editable.
      get("idKeyInput").setValueStateText("Key change is not possible - try creating a new data set instead");

      // Change the text of the edit button, and update it's event handler
      var oButton = oEvent.getSource();
      oButton.setText("Done");
      oButton.detachPress(this.onEditPress, this)
              .attachPress(this.onDonePress, this);

      // Cancel button can now be shown.
      this.getView().byId("idCancelButton").setVisible(this._editMode);

      // set all of the definition links to be emphasized
      this._mSelect.setProperty("/subtle", !this._editMode);
      this._mSelect.setProperty("/emphasized", this._editMode);
    };

    /**
     * Cancel editing. We need to return all controls to their original
     * values
     * @param  {Event} oEvent Button event
     */
    Sheets.prototype.onCancelPress = function(oEvent) {

      // Exit edit mode
      var m = this._editMode = false;

      // Easier
      var get = jQuery.proxy(this.getControl, this);

      // Now we undo all the changes... first, the text input.
      var oControl = get("idNameInput");
      oControl.setValue(oControl.data("original"))
                .setValueState(sap.ui.core.ValueState.None)
                .setValueStateText("")
                .setEnabled(m);

      // and the check box
      oControl = get("idHeadersCheckbox");
      oControl.setSelected(oControl.data("original") === "X")
                .setEnabled(m);

      // The key input has it's value state text removed
      get("idKeyInput").setValueStateText("")
                        .setEnabled(m);

      // And the links
      this._aLinks.forEach(function(link, index) {
        // replace the link text with the original text
        link.setText(link.data("original"));
      }, this);

      // set all of the definition links to be emphasized
      this._mSelect.setProperty("/subtle", !m);
      this._mSelect.setProperty("/emphasized", m);

      // Update the Done button - it reverts back to being an Edit button
      var oButton = get("idEditButton");
      oButton.setText("Edit")
              .detachPress(this.onDonePress, this)
              .attachPress(this.onEditPress, this);

      // Cancel button can now be shown.
      this.getView().byId("idCancelButton").setVisible(this._editMode);

      // Clear links
      while (this._aLinks.length > 0) {
        this._aLinks.pop();
      }
      this._oLink = null;
    };

    /**
     * Once the user is done editing, we'll validate the name they've given
     * their data set, and save any other changes
     * @param  {Event} oEvent Button press event
     */
    Sheets.prototype.onDonePress = function(oEvent) {

      // Exit edit mode
      var m = false;

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
        name : get("idNameInput").getValue(),
      }));
      aBatch.push(oModel.createBatchOperation("/GoogleSheets('" + this._sId + "')", "MERGE", {
        title : get("idNameInput").getValue(),
        headers : ( get("idHeadersCheckbox").getSelected() ? "X" : " " )
      }));

      // And the links...
      this._aLinks.forEach(function(link, index) {
        var sType = link.data("original");
        if (sType) {
          var sId = link.getBindingContext("dataset").getProperty("id"); // Dimension Id
          aBatch.push(oModel.createBatchOperation("/Dimensions('" + sId + "')", "MERGE", {
            type : link.getText().toLowerCase()
          }));
        }
      }, this);

      // Add and Submit!
      oModel.addBatchChangeOperations(aBatch);
      oModel.submitBatch(
        // Success
        jQuery.proxy(function(oData, oResponse, aErrorResponses) {
          // We'll make the Name disabled.
          oControl.setEnabled(m);
          get("idHeadersCheckbox").setEnabled(m);

          // Change the text of the edit button, and update it's event handler
          oButton.setText("Edit")
                  .detachPress(this.onDonePress, this)
                  .attachPress(this.onEditPress, this);

          // Cancel button can now be shown.
          get("idCancelButton").setVisible(m);

          // set all of the definition links to be emphasized
          this._mSelect.setProperty("/subtle", !m);
          this._mSelect.setProperty("/emphasized", m);

          // Clear links
          while (this._aLinks.length > 0) {
            this._aLinks.pop();
          }
          this._oLink = null;

          // Set global edit flag
          this._editMode = m;

          // Busy
          this.hideBusyDialog();
        }, this),
        // Error
        jQuery.proxy(function(oError) {

        }, this),
        true, /* bAsync */
        false  /* bImportData */
      );
    };

    /***
     *    ███████╗██████╗ ██╗████████╗
     *    ██╔════╝██╔══██╗██║╚══██╔══╝
     *    █████╗  ██║  ██║██║   ██║
     *    ██╔══╝  ██║  ██║██║   ██║
     *    ███████╗██████╔╝██║   ██║
     *    ╚══════╝╚═════╝ ╚═╝   ╚═╝
     *
     */

     /**
      * On press, first check if we're in edit mode, and then display the definition
      * listing pop-up.
      * @param  {Event} oEvent Link press event
      */
    Sheets.prototype.onDefinitionLinkPress = function(oEvent) {
      // If we're not in edit mode, then display a little reminder to get into edit
      // mode first.
      if(!this._editMode) {
        this.showInfoAlert("Before you can edit the data set definition types, you'll need to enter edit mode...", "Edit definition", sap.ui.Device.system.phone);
        return;
      }

      // Otherwise, we can show the definition pop-up and go from there.
      if (!this._oDefinitionDialog) {
        this._oDefinitionDialog = sap.ui.xmlfragment("idDefinitionFragment", "view.data.DimensionDataTypeDialog", this);
        this.getView().addDependent(this._oDefinitionDialog);
      }

      // Now bind the dialog to our dimension
      this._oLink = oEvent.getSource();
      var sId = this._oLink.getBindingContext("dataset").getProperty("id");
      this._oDefinitionDialog.bindElement({
        path : "dataset>/Dimensions('" + sId + "')"
      });

      // Open
      this._oDefinitionDialog.open();
    };

    /**
     * When the select item is pressed, this triggers a temporary storage of The
     * value, ready for updating when the user hits done.
     * @param  {event} oEvent Button press event
     */
    Sheets.prototype.onTypeSelectChanged = function (oEvent) {

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
    Sheets.prototype.onTypeDialogClose = function (oEvent) {
      // Close
      if (this._oDefinitionDialog) {
        this._oDefinitionDialog.close();
      }
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
    Sheets.prototype.onNameInputChange = function (oEvent) {
      // Check that the value is not empty
      this._isValid(oEvent.getSource(), oEvent.getParameter("value").trim());
    };

    /**
     * Checks if the entered details are valid.
     * @return {Boolean} Valid?
     */
    Sheets.prototype._isValid = function (oInput, sValue) {

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
