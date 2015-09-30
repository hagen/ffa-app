jQuery.sap.declare("view.data.CreateSheets");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/CreateController"],
  function(jQuery, Controller) {
    "use strict";

    var Sheets = Controller.extend("view.data.CreateSheets", /** @lends view.data.CreateSheets.prototype */ {

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
        name: "",
        //name: "BHP stock prices",
        key: "",
        //key: "1MnR5fxrZMrtqZxjtJhKYRtDythV9QUi34DQdnEO5YlQ",
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
     * User wishes to save the Google Sheets configuration...
     * @param  {object} oEvent Button press event
     */
    Sheets.prototype.onNextPress = function(oEvent) {
      // Validation; If name or key are empty, then raise errors.
      if (!this.validate(this.getView().byId("idNameInput"), this.getView().byId("idKeyInput"))) {
        return;
      }

      var oButton = oEvent.getSource();

      // set screen to busy
      this.openBusyDialog({
        title: "Loading",
        text: "Retrieving your Sheet - one moment please..."
      });

      // save Google Sheets data source
      this.getView().getModel("dataset").create("/GoogleSheets", this.getData(), {
        success: jQuery.proxy(function(oData, mResponse) {

          // Retain our new ID
          this._sId = oData.id;

          // Button is now bound to the save action
          oButton.detachPress(this.onNextPress, this)
            .attachPress(this.onSavePress, this)
            .setText("Save");

          this.getView().byId("idBackButton").setEnabled(true);

          // advance to the next page
          var oNav = this.getView().byId("idNavContainer");
          var oPage = this.getView().byId("idPage2");
          oPage.bindElement("dataset>/DataSets('" + this._sId + "')", {
            parameters: {
              expand: "Dimensions"
            }
          });

          // Bind the variables table to the data definition, but REMOVE the forecast
          // field(s).
          var oTable = this.getView().byId(
            sap.ui.core.Fragment.createId("idFieldsFragment", "idFieldsTable")
          );

          // Bind table rows (items)
          oTable.bindItems({
            path: "dataset>Dimensions",
            sorter: [new sap.ui.model.Sorter("index", false)],
            template: sap.ui.xmlfragment("view.data.SchemaField", this)
          });

          // Now we nav...
          oNav.to(oPage, "slide");

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
     * User wishes to save the Sheets configuration... This is a fake
     * step, as the data set is already saved.
     * @param  {object} oEvent Button press event
     */
    Sheets.prototype.onSavePress = function(oEvent) {

      // set screen to busy
      this.openBusyDialog({
        title: "Saving",
        text: "Saving your Sheet - one moment please..."
      });

      // Save the date field
      this.saveDateField(
        jQuery.proxy(function(oData, mResponse) {

          // Refresh the dataset listing by raising an event (subscribers will do
          // the work)
          this.getEventBus().publish("Detail", "RefreshMaster", {});

          // Timed close.
          jQuery.sap.delayedCall(1500, this, function() {

            // NOt busy any more
            this.closeBusyDialog();

            // Navigate to the new data set...
            this.getRouter().navTo("view-google", {
              dataset_id: this._sId
            }, !sap.ui.Device.system.phone);

            // return to the first page and close
            this.onBackPress(null /* oEvent*/, false /* bDelete */ );
          });
        }, this)
      );
    };

    /**
     *
     * @param  {object} oEvent Button press event
     * @param  {boolean} bDelete? Delete created entity (default true)
     */
    Sheets.prototype.onBackPress = function(oEvent, bDelete) {

      // if delete is not provided, then it is true
      if (bDelete === undefined) {
        bDelete = true;
      }
      // because the back press function can be called by non events, we need
      // to ensure we have a reference to the back button, either from the event
      // source, or by collecting it from the view.
      var oButton = null;
      if (oEvent) {
        oButton = oEvent.getSource();
      } else {
        oButton = this.getView().byId("idBackButton");
      }

      // Use promises to holdup cancellation until deletion occurs
      var oPromise = jQuery.Deferred();
      jQuery.when(oPromise).then(jQuery.proxy(function() {
        // Clear out sId
        this._sId = undefined;

        // Are we testing connection, or saving dataset?
        var oNavContainer = this.getView().byId("idNavContainer");
        oNavContainer.back();

        // Button is now bound to the save action
        oButton.setEnabled(false);

        // and the next button?
        oButton = this.getView().byId("idNextButton");
        oButton.detachPress(this.onSavePress, this)
          .attachPress(this.onNextPress, this)
          .setText("Next");
      }, this))

      // We may need to delete the just created data set...
      if (this._sId && bDelete) {
        this.delete(this._sId, oPromise);
      } else {
        oPromise.resolve();
      }
    };

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
        this.delete(this._sId, oPromise);
      } else {
        oPromise.resolve();
      }
    };

    /**
     * When the help icon is pressed, show help :)
     * @param  {object} oEvent Icon press event
     */
    Sheets.prototype.onHelpPress = function(oEvent) {
      alert("Help");
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Sheets.prototype.getData = function() {
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
     * @param  {[type]} oKeyInput  [description]
     * @return {[type]}            [description]
     */
    Sheets.prototype.validate = function(oNameInput, oKeyInput) {
      var bName = true;
      var bKey = true;

      // Check name
      if (oNameInput.getValue() === "") {
        oNameInput.setValueState(sap.ui.core.ValueState.Error);
        oNameInput.setValueStateText("You must provide a name");
        bName = false;
      } else {
        oNameInput.setValueState(sap.ui.core.ValueState.None);
        oNameInput.setValueStateText("");
        bName = true;
      }

      if (oKeyInput.getValue() === "") {
        oKeyInput.setValueState(sap.ui.core.ValueState.Error);
        oKeyInput.setValueStateText("You must provide a Sheet key");
        bKey = false;
      } else {
        oKeyInput.setValueState(sap.ui.core.ValueState.None);
        oKeyInput.setValueStateText("");
        bKey = true;
      }

      // AND the result
      return bName && bKey;
    };

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

    return Sheets;

  }, /* bExport= */ true);
