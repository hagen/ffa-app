jQuery.sap.declare("view.data.GoogleSheets");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Sheets = Controller.extend("view.data.GoogleSheets", /** @lends view.data.GoogleSheets.prototype */ {

    });

    /**
     *
     */
    Sheets.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("sheets").attachPatternMatched(this._onRouteMatched, this);
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

      // Testing only
      this._mSheets = new sap.ui.model.json.JSONModel({
        id: ShortId.generate(10),
        name: "BHP stock prices",
        key: "1MnR5fxrZMrtqZxjtJhKYRtDythV9QUi34DQdnEO5YlQ",
        has_headers: true
      });

      this.getView().setModel(this._mSheets, "sheets");
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
     * [function description]
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Sheets.prototype.onCancelPress = function(oEvent) {
      // nav back to main Page
      try {
        this.getView().byId("idNavContainer").back();
      } catch (e) {}

      // Use promises to holdup cancellation until deletion occurs
      var oPromise = jQuery.Deferred();
      jQuery.when(oPromise).then(jQuery.proxy(function() {
        // Clear out sId
        this._sId = undefined;
        // Nav back to new data set
        this.getRouter().navTo("new-dataset", {}, !sap.ui.Device.system.phone);
      }, this))

      // We may need to delete the just created data set...
      if (this._sId) {
        this._delete(this._sId, oPromise);
      } else {
        oPromise.resolve();
      }
    };

    /**
     * User wishes to save the Google Sheets configuration...
     * @param  {object} oEvent Button press event
     */
    Sheets.prototype.onNextPress = function(oEvent) {
      // Are we testing access to the sheet, or saving?
      var oNavContainer = this.getView().byId("idNavContainer");
      if (oNavContainer.getCurrentPage().getId().indexOf("idPage2") > -1) {
        // Save
        this._save();
      } else {
        // Test
        this._test();
      }
    };

    /**
     *
     * @param  {object} oEvent Button press event
     */
    Sheets.prototype.onBackPress = function(oEvent) {
      // Are we testing connection, or saving dataset?
      var oNavContainer = this.getView().byId("idNavContainer");
      oNavContainer.back();
    };

    /**
     * When the help icon is pressed, show help :)
     * @param  {object} oEvent Icon press event
     */
    Sheets.prototype.onHelpIconPress = function(oEvent) {
      alert("Help");
    };

    /***
     *    ██████╗ ██████╗ ██╗██╗   ██╗ █████╗ ████████╗███████╗
     *    ██╔══██╗██╔══██╗██║██║   ██║██╔══██╗╚══██╔══╝██╔════╝
     *    ██████╔╝██████╔╝██║██║   ██║███████║   ██║   █████╗
     *    ██╔═══╝ ██╔══██╗██║╚██╗ ██╔╝██╔══██║   ██║   ██╔══╝
     *    ██║     ██║  ██║██║ ╚████╔╝ ██║  ██║   ██║   ███████╗
     *    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═╝  ╚═╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Sheets.prototype._test = function() {
      // Validation; If name or key are empty, then raise errors.
      if (!this._validate(this.getView().byId("idNameInput"), this.getView().byId("idKeyInput"))) {
        return;
      }

      // set screen to busy
      this.openBusyDialog({
        title: "Loading",
        text: "Retrieving your Sheet - one moment please..."
      });

      // save Google Sheets data source
      this.getView().getModel("dataset").create("/GoogleSheets", this._getData(), {
        success: jQuery.proxy(function(oData, mResponse) {

          // Retain our new ID
          this._sId = oData.id;

          // advance to the next page
          var oNav = this.getView().byId("idNavContainer");
          var oPage = this.getView().byId("idPage2");
          oPage.bindElement("dataset>/DataSets('" + oData.id + "')");
          oNav.to(oPage, "slide");

          // Button is now bound to the save action
          this.getView().byId("idNextButton").setText("Save");
          this.getView().byId("idBackButton").setEnabled(true);

          // not busy any more
          this.closeBusyDialog();
        }, this),
        error: jQuery.proxy(function(mError) {

          // Handle connection test errors
          this._handleTestError(mError);

          // not busy any more
          this.closeBusyDialog();
        }, this),
        async: true
      });
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Sheets.prototype._save = function() {
      // Validate that the selected column is of type date.
      var aItems = this.getView().byId("idDimensionsTable").getSelectedItems();
      if (aItems.length === 0) {
        this.showErrorAlert("Err, we're gonna need a date column. Please pick one.", "Date column", true /*bCompact*/ );
        return;
      }

      var oContext = aItems[0].getBindingContext("dataset");
      if (oContext.getProperty("type").toLowerCase() !== "date") {
        this.showErrorAlert("Pop. Please only select a column of type 'Date'.", "Date column", true /*bCompact*/ );
        return;
      }

      // set screen to busy
      this.openBusyDialog({
        title: "Saving",
        text: "Saving your Sheet - one moment please..."
      });
      
      // Refresh the dataset listing by raising an event (subscribers will do
      // the work)
      this.getEventBus().publish("Detail", "RefreshMaster", {});

      // Timed close.
      jQuery.sap.delayedCall(1500, this, function() {

        // NOt busy any more
        this.closeBusyDialog();

        // Navigate to the new data set...
        this.getRouter().navTo("datasets", {
          dataset_id: this._sId
        }, !sap.ui.Device.system.phone);

        // return to the first page and close
        this.onBackPress(null /* oEvent*/ );
      });
    };

    /**
     * Given the name and key input fields, this checks they both have a value,
     * and if one does not, then an error is displayed.
     * @param  {[type]} oNameInput [description]
     * @param  {[type]} oKeyInput  [description]
     * @return {[type]}            [description]
     */
    Sheets.prototype._validate = function(oNameInput, oKeyInput) {
      var bName = true;
      var bKey = true;

      // Check name
      if (oNameInput.getValue() === "") {
        oNameInput.setValueState(sap.ui.core.ValueState.Error);
        oNameInput.setValueStateText("You must provide a name");
        bName = false;
      } else {
        oNameInput.setValueState(sap.ui.core.ValueState.Success);
        oNameInput.setValueStateText("");
        bName = true;
      }

      if (oKeyInput.getValue() === "") {
        oKeyInput.setValueState(sap.ui.core.ValueState.Error);
        oKeyInput.setValueStateText("You must provide a Sheet key");
        bKey = false;
      } else {
        oKeyInput.setValueState(sap.ui.core.ValueState.Success);
        oKeyInput.setValueStateText("");
        bKey = true;
      }

      // AND the result
      return bName && bKey;
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Sheets.prototype._getData = function() {
      // Collect the key we're to use
      return {
        id: ShortId.generate(10),
        key: this.getView().byId("idKeyInput").getValue(),
        title: this.getView().byId("idNameInput").getValue(),
        headers: (this.getView().byId("idHeadersCheckbox").getSelected() ? "X" : " "),
        created_by: this.getUserId()
      };
    };

    /***
     *    ██████╗  █████╗ ████████╗ █████╗     ████████╗██╗   ██╗██████╗ ███████╗███████╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝
     *    ██║  ██║███████║   ██║   ███████║       ██║    ╚████╔╝ ██████╔╝█████╗  ███████╗
     *    ██║  ██║██╔══██║   ██║   ██╔══██║       ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  ╚════██║
     *    ██████╔╝██║  ██║   ██║   ██║  ██║       ██║      ██║   ██║     ███████╗███████║
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝       ╚═╝      ╚═╝   ╚═╝     ╚══════╝╚══════╝
     *
     */

    /**
     * When the data definition type link is pressed, we allow the user to modify
     * the data type, through a simple drop-down. Changes are immediate.
     * @param  {object} oEvent Link press event
     */
    Sheets.prototype.onTypeLinkPress = function(oEvent) {
      // Get the source and it's binding context
      var oLink = oEvent.getSource();
      var oParent = oLink.getParent(); // Column list item (with collection cells)
      var sId = oParent.getBindingContext("dataset").getProperty("id");

      // Create the dialog fragment.
      if (!this._oTypeDialog) {
        this._oTypeDialog = sap.ui.xmlfragment("idDataTypeFragment", "view.data.DimensionDataTypeDialog", this);
        this.getView().addDependent(this._oTypeDialog);
      }

      // Just set the correct selected key
      sap.ui.core.Fragment.byId("idDataTypeFragment", "idDimensionDataTypeSelectList").setSelectedKey(oLink.getText().toLowerCase());

      // supply the dialog with the binding Id, so we can use it later...
      this._oTypeDialog.data("id", sId);

      // now show the dialog
      this._oTypeDialog.open();
    };

    /**
     * When the dimension data type picker dialog is closed, we simply
     * close the dialog; no changes are applied
     * @param  {object} oEvent  Event source (button press)
     */
    Sheets.prototype.onTypeDialogClose = function(oEvent) {
      // No longer busy
      this._oTypeDialog.setBusy(false);
      // now close the dialog
      this._oTypeDialog.close();
    };

    /**
     * When the dimension type select is changed, this event handler is fired
     * by proxy, and in so doing, is passed the event source the select) and
     * the original link. The link object needs to be replaced into the collection
     * of cells, at position 2 (index 1)
     * @param  {object} oEvent  Event source (Dropdown to hide)
     */
    Sheets.prototype.onTypeSelectChanged = function(oEvent) {
      // Busy!
      this._oTypeDialog.setBusy(true);

      var oItem = oEvent.getParameter("selectedItem");
      var sType = oItem.getText().toLowerCase();
      var sId = this._oTypeDialog.data("id");

      // when the dropdown selection is changed
      // save the change and return the link with it's new value
      var oModel = this.getView().getModel("dataset");
      oModel.setProperty("/Dimensions('" + sId + "')/type", sType);
      oModel.submitChanges(jQuery.proxy(function() {
          // close
          this.onTypeDialogClose(null);
        }, this), jQuery.proxy(function() {
          // close
          this.onTypeDialogClose(null);
        }, this),
        false);
    }

    /***
     *     ██████╗ ██████╗ ███╗   ██╗███████╗ ██████╗ ██╗     ███████╗
     *    ██╔════╝██╔═══██╗████╗  ██║██╔════╝██╔═══██╗██║     ██╔════╝
     *    ██║     ██║   ██║██╔██╗ ██║███████╗██║   ██║██║     █████╗
     *    ██║     ██║   ██║██║╚██╗██║╚════██║██║   ██║██║     ██╔══╝
     *    ╚██████╗╚██████╔╝██║ ╚████║███████║╚██████╔╝███████╗███████╗
     *     ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝╚══════╝
     *
     */

    /**
     * Handles connection error
     * @param  {[type]} mError [description]
     * @return {[type]}        [description]
     */
    Sheets.prototype._handleTestError = function(mError) {
      // Something went wrong!
      var oConsole = this.getView().byId("idTestConsoleTextArea");
      this._populateConsole(mError, oConsole);
    };

    /**
     * Handles connection error
     * @param  {[type]} mError [description]
     * @return {[type]}        [description]
     */
    Sheets.prototype._handleSaveError = function(mError) {
      // Something went wrong!
      // var oConsole = this.getView().byId("idSaveConsoleTextArea");
      // this._populateConsole(mError, oConsole);
    };

    /**
     * [function description]
     * @param  {[type]} mError   [description]
     * @param  {[type]} oConsole [description]
     * @return {[type]}          [description]
     */
    Sheets.prototype._populateConsole = function(vError, oConsole) {
      var sMessage = "";

      if (typeof vError === "object") {
        var mXML = new sap.ui.model.xml.XMLModel();
        mXML.setXML(vError.response.body);
        sMessage = mXML.getProperty("/message"); //.replace(/}.+$/g, "").replace(/^.+{/g, "");
      } else if (typeof vError === "string") {
        sMessage = vError;
      }
      oConsole.setValue(sMessage);
    };

    /**
     * Deletes a recently created data set
     * @param  {String} sId [description]
     * @param  {Deferred} oPromise [description]
     */
    Sheets.prototype._delete = function(sId, oPromise) {
      this.getView().getModel("dataset").remove("/DataSets('" + sId + "')", {
        success: jQuery.proxy(function(oData, mResponse) {
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {
          oPromise.resolve();
        }, this)
      });
    };

    return Sheets;

  }, /* bExport= */ true);
