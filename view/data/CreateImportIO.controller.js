jQuery.sap.declare("view.data.CreateImportIO");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var IO = Controller.extend("view.data.CreateImportIO", /** @lends view.data.CreateImportIO.prototype */ {

    });

    /**
     *
     */
    IO.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("importio").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    IO.prototype.onExit = function() {};

    /**
     *
     */
    IO.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    IO.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    IO.prototype._onRouteMatched = function(oEvent) {

      // Testing only
      this._mIO = new sap.ui.model.json.JSONModel({
        id: ShortId.generate(10),
        name: "ImportIO test",
        url: "https://api.import.io/store/data/c1a66d70-4a5f-4e0e-ba6b-56ffb82c381f/_query?input/webpage/url=http%3A%2F%2Fwww.timeanddate.com%2Fholidays%2Fgermany%2F&_user=9c877574-9734-4c33-b37e-f379490ee7ae&_apikey=9c87757497344c33b37ef379490ee7aeae42db154e63f66607c7b89654bcb48f58f35115d41d18ae8db493b4db743bbd868652c9c6f255827bc8cb3715f038d9e205e6f9a6d9421987b8861f89372250"
      });

      this.getView().setModel(this._mIO, "importio");
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
    IO.prototype.onCancelPress = function(oEvent) {
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
     * User wishes to save the Import IO configuration...
     * @param  {object} oEvent Button press event
     */
    IO.prototype.onNextPress = function(oEvent) {
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
    IO.prototype.onBackPress = function(oEvent) {
      // Are we testing connection, or saving dataset?
      var oNavContainer = this.getView().byId("idNavContainer");
      oNavContainer.back();
    };

    /**
     * When the help icon is pressed, show help :)
     * @param  {object} oEvent Icon press event
     */
    IO.prototype.onHelpPress = function(oEvent) {
      alert("Help");
    };

    /***
     *    ████████╗███████╗███████╗████████╗
     *    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝
     *       ██║   █████╗  ███████╗   ██║
     *       ██║   ██╔══╝  ╚════██║   ██║
     *       ██║   ███████╗███████║   ██║
     *       ╚═╝   ╚══════╝╚══════╝   ╚═╝
     *
     */

    /**
     * [function description]
     * @return {[type]} [description]
     */
    IO.prototype._test = function() {
      // Validation; If name or key are empty, then raise errors.
      if (!this._validate(this.getView().byId("idNameInput"), this.getView().byId("idUrlInput"))) {
        return;
      }

      // set screen to busy
      this.openBusyDialog({
        title: "Loading",
        text: "Retrieving your ImportIO data set - one moment please..."
      });

      // save Google IO data source
      this.getView().getModel("dataset").create("/ImportIO", this._getData(), {
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
     * Collects all relevant data for a POST payload to create the data set
     * @return {Object} Named array of all POST params
     */
    IO.prototype._getData = function() {
      // Return the POST payload
      return {
        id : ShortId.generate(10),
        url : this.getView().byId("idUrlInput").getValue(),
        name : this.getView().byId("idNameInput").getValue(),
        created_by : this.getProfileId()
      };
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
     * [function description]
     * @return {[type]} [description]
     */
    IO.prototype._save = function() {
      // Validate that the selected column is of type date.
      var aItems = this.getView().byId("idDimensionsTable").getSelectedItems();
      if (aItems.length === 0) {
        this.showErrorAlert(
          "Err, we're gonna need a date column. Please pick one.",
          "Date column",
          sap.ui.Device.system.phone /*bCompact*/
        );
        return;
      }

      var oContext = aItems[0].getBindingContext("dataset");
      if (oContext.getProperty("type").toLowerCase() !== "date") {
        this.showErrorAlert(
          "Pop. Please only select a column of type 'Date'.",
          "Date column",
          sap.ui.Device.system.phone /*bCompact*/
        );
        return;
      }

      // set screen to busy
      this.openBusyDialog({
        title: "Saving",
        text: "Saving your ImportIO data set - one moment please..."
      });

      // Refresh the dataset listing by raising an event (subscribers will do
      // the work)
      this.getEventBus().publish("Detail", "RefreshMaster", {});

      // Timed close.
      jQuery.sap.delayedCall(1500, this, function() {

        // NOt busy any more
        this.closeBusyDialog();

        // Navigate to the new data set...
        this.getRouter().navTo("view-importio", {
          dataset_id: this._sId
        }, !sap.ui.Device.system.phone);

        // return to the first page and close
        this.onBackPress(null /* oEvent*/ );
      });
    };

    /***
     *    ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗███████╗
     *    ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
     *    ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   █████╗
     *    ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██╔══╝
     *     ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ███████╗
     *      ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Given the name and key input fields, this checks they both have a value,
     * and if one does not, then an error is displayed.
     * @param  {[type]} oNameInput [description]
     * @param  {[type]} oUrlInput  [description]
     * @return {[type]}            [description]
     */
    IO.prototype._validate = function(oNameInput, oUrlInput) {
      var bName = true;
      var bUrl = true;
      var sPattern = /https:\/\/api.import.io/g;

      // Check name
      var sValue = oUrlInput.getValue();
      if (sValue === "") {
        oNameInput.setValueState(sap.ui.core.ValueState.Error);
        oNameInput.setValueStateText("You must provide a name");
        bName = false;
      } else {
        oNameInput.setValueState(sap.ui.core.ValueState.None);
        oNameInput.setValueStateText("");
        bName = true;
      }

      sValue = oUrlInput.getValue();
      if (sValue === "") {
        oUrlInput.setValueState(sap.ui.core.ValueState.Error);
        oUrlInput.setValueStateText("You must provide an API integration URL");
        bUrl = false;
      } else if (!sPattern.test(sValue)){
        oUrlInput.setValueState(sap.ui.core.ValueState.Error);
        oUrlInput.setValueStateText("The URL should start with https://api.import.io");
        bUrl = false;
      } else {
        oUrlInput.setValueState(sap.ui.core.ValueState.None);
        oUrlInput.setValueStateText("");
        bUrl = true;
      }

      // AND the result
      return bName && bUrl;
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
    IO.prototype.onTypeLinkPress = function(oEvent) {
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
    IO.prototype.onTypeDialogClose = function(oEvent) {
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
    IO.prototype.onTypeSelectChanged = function(oEvent) {
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
    IO.prototype._handleTestError = function(mError) {
      // Something went wrong!
      var oConsole = this.getView().byId("idTestConsoleTextArea");
      this._populateConsole(mError, oConsole);
    };

    /**
     * Handles connection error
     * @param  {[type]} mError [description]
     * @return {[type]}        [description]
     */
    IO.prototype._handleSaveError = function(mError) {
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
    IO.prototype._populateConsole = function(vError, oConsole) {
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
    IO.prototype._delete = function(sId, oPromise) {
      this.getView().getModel("dataset").remove("/DataSets('" + sId + "')", {
        success: jQuery.proxy(function(oData, mResponse) {
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {
          oPromise.resolve();
        }, this)
      });
    };

    return IO;

  }, /* bExport= */ true);
