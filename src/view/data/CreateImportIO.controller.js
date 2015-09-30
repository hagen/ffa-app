jQuery.sap.declare("view.data.CreateImportIO");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/CreateController"],
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
        // name: "",
        name: "ImportIO test",
        // url: ""
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
     * Advancing to the data type listing. We are now creating then
     * data set, and so any action to go back or cancel must Delete
     * the dataset
     * @param  {object} oEvent Button press event
     */
    IO.prototype.onNextPress = function(oEvent) {
      // Validation; If name or key are empty, then raise errors.
      if (!this.validate(this.getView().byId("idNameInput"), this.getView().byId("idUrlInput"))) {
        return;
      }

      var oButton = oEvent.getSource();

      // set screen to busy
      this.openBusyDialog({
        title: "Loading",
        text: "Retrieving your ImportIO data set - one moment please..."
      });

      // save Google IO data source
      this.getView().getModel("dataset").create("/ImportIO", this.getData(), {
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
     * User wishes to save the Import IO configuration... This is a fake
     * step, as the data set is already saved.
     * @param  {object} oEvent Button press event
     */
    IO.prototype.onSavePress = function(oEvent) {

      // set screen to busy
      this.openBusyDialog({
        title: "Saving",
        text: "Saving your ImportIO data set - one moment please..."
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
            this.getRouter().navTo("view-importio", {
              dataset_id: this._sId
            }, !sap.ui.Device.system.phone);

            // return to the first page and close
            this.onBackPress(null /* oEvent*/, false /* bDelete */ );
          });
        }, this)
      );
    };

    /**
     * When the back button is pressed, we are reseting to The first screen
     * so as to ensure all the buttons work correctly, and display the correct
     * text
     * @param  {object}  oEvent   Button press event
     * @param  {boolean} bDelete? Delete created entity (default true)
     */
    IO.prototype.onBackPress = function(oEvent, bDelete) {

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
       this.delete(this._sId, oPromise);
     } else {
       oPromise.resolve();
     }
   };

    /**
     * When the help icon is pressed, show help :)
     * @param  {object} oEvent Icon press event
     */
    IO.prototype.onHelpPress = function(oEvent) {
      alert("Help");
    };

    /**
     * Collects all relevant data for a POST payload to create the data set
     * @return {Object} Named array of all POST params
     */
    IO.prototype.getData = function() {
      // Return the POST payload
      return {
        id : ShortId.generate(10),
        url : this.getView().byId("idUrlInput").getValue(),
        name : this.getView().byId("idNameInput").getValue(),
        created_by : this.getProfileId()
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
     * @param  {[type]} oUrlInput  [description]
     * @return {[type]}            [description]
     */
    IO.prototype.validate = function(oNameInput, oUrlInput) {
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

    return IO;

  }, /* bExport= */ true);
