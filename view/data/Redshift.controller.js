jQuery.sap.declare("view.data.Redshift");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/NewDataSetController"],
  function(jQuery, Controller) {
    "use strict";

    var Redshift = Controller.extend("view.data.Redshift", /** @lends view.data.Redshift.prototype */ {

    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    Redshift.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("redshift").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Redshift.prototype.onExit = function() {};

    /**
     *
     */
    Redshift.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Redshift.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Redshift.prototype._onRouteMatched = function(oEvent) {

      // Testing only
      this._mRedshift = new sap.ui.model.json.JSONModel({
        id: ShortId.generate(10),
        name: "Redshift dataset",
        endpoint: "forefront-test.c63cnbrlgold.ap-southeast-1.redshift.amazonaws.com",
        port: 5439,
        database: "db1",
        username: "kermit",
        password: "1h6LW3mI3Ozg50q",
        remember: false,
        query: ""
      });

      this.getView().setModel(this._mRedshift, "redshift");
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
    Redshift.prototype.onCancelPress = function(oEvent) {
      // nav back to main Page
      try {
        this.getView().byId("idNavContainer").back();
      } catch (e) {}

      // Nav back to new data set
      this.getRouter().navTo("new-dataset", {}, !sap.ui.Device.system.phone);
    };

    /**
     * This handler is used either to advance the configuration page
     * to the query page, or save the query. When advancing to the next page,
     * we will firstly test the connection. If all goes well, update the text
     * for this button to 'Save'.
     * @param  {object} oEvent Button press event
     */
    Redshift.prototype.onNextPress = function(oEvent) {
      // Are we testing connection, or saving dataset?
      var oNavContainer = this.getView().byId("idNavContainer");
      if (oNavContainer.getCurrentPage().getId() === "idPage2") {
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
    Redshift.prototype.onBackPress = function(oEvent) {
      // Are we testing connection, or saving dataset?
      var oNavContainer = this.getView().byId("idNavContainer");
      oNavContainer.back();
    };

    /**
     * Run the query against the redshift connection.
     * @param  {event} oEvent Button press event
     */
    Redshift.prototype.onQueryPress = function(oEvent) {
      // Check the user has entered a query...
      var sQuery = this.getView().byId("idQueryTextArea").getValue();
      if (!sQuery) {
        this.showInfoAlert("D'oh, you forgot to enter a query. We'll need this to continue...", "Empty query", true /* bCompact */ );
        return;
      }

      // set screen to busy
      this.openBusyDialog({
        title: "Testing",
        text: "Testing your query - one moment please..."
      });

      // Submit the query, and display whatever we get back...
      this.getView().getModel("dataset").create("/RedshiftTest", this._getData(), {
        async: true,
        success: jQuery.proxy(function(oData, mResponse) {

          // Handle error with null, clears Error
          this._handleSaveError("All good!");

          // NOt busy any more
          this.closeBusyDialog();
        }, this),
        error: jQuery.proxy(function(mError) {
          // Handle connection test errors
          this._handleSaveError(mError);

          // not busy any more
          this.closeBusyDialog();
        }, this)
      });
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
    Redshift.prototype._test = function() {

      // set screen to busy
      this.openBusyDialog({
        title: "Connecting",
        text: "Testing your Redshift connection - one moment please..."
      });

      // Test redshift; success call back if connection could be made
      this.getView().getModel("dataset").create("/RedshiftTest", this._getData(), {
        async: true,
        success: jQuery.proxy(function(oData, mResponse) {

          // advance to the next page
          let oNav = this.getView().byId("idNavContainer");
          let oPage = this.getView().byId("idPage2");
          oNav.to(oPage, "slide");

          // Button is now bound to the save action
          this.getView().byId("idNextButton").setText("Save");
          this.getView().byId("idBackButton").setEnabled(true);

          // Handle error with empty, clears Error
          this._handleTestError();

          // not busy any more
          this.closeBusyDialog();
        }, this),
        error: jQuery.proxy(function(mError) {
          // Handle connection test errors
          this._handleTestError(mError);

          // not busy any more
          this.closeBusyDialog();
        }, this)
      });
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Redshift.prototype._save = function() {
      // set screen to busy
      this.openBusyDialog({
        title: "Saving",
        text: "Saving your Redshift query - one moment please..."
      });

      // Save the redshift data...
      this.getView().getModel("dataset").create("/Redshift", this._getData(), {
        success: jQuery.proxy(function(oData, mResponse) {
          // Refresh the dataset listing by raising an event (subscribers will do
          // the work)
          this.getEventBus().publish("Detail", "RefreshMaster", {});

          // Update the screen, then close.
          this.updateBusyDialog({
            text: "All done! Finishing up..."
          });

          // Timed close.
          jQuery.sap.delayedCall(1500, this, function() {

            // NOt busy any more
            this.closeBusyDialog();

            // Navigate to the new data set...
            this.getRouter().navTo("datasets", {
              dataset_id: oData.id
            }, !sap.ui.Device.system.phone);

            // Reset the Back/Next buttons
            this.getView().byId("idNextButton").setText("Next");
            this.getView().byId("idBackButton").setEnabled(false);
          });
        }, this),
        error: jQuery.proxy(function(mError) {

          // Handle connection test errors
          this._handleSaveError(mError);

          // not busy any more
          this.closeBusyDialog();
        }, this),
        async: true,
      });
    };

    /**
     * Given the name and key input fields, this checks they both have a value,
     * and if one does not, then an error is displayed.
     * @param  {[type]} oNameInput [description]
     * @param  {[type]} oKeyInput  [description]
     * @return {[type]}            [description]
     */
    Redshift.prototype._validate = function() {

    };

    /**
     * Retrieves data from the model, does some formatting, and returns.
     * @return {object} OData object
     */
    Redshift.prototype._getData = function() {
      let oData = this._mRedshift.getData();
      oData.remember = (oData.remember ? "X" : " ");
      oData.port = parseInt(oData.port, 10);

      // return
      return oData;
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
    Redshift.prototype._handleTestError = function(mError) {
      // Something went wrong!
      let oConsole = this.getView().byId("idTestConsoleTextArea");
      this._populateConsole(mError, oConsole);
    };

    /**
     * Handles connection error
     * @param  {[type]} mError [description]
     * @return {[type]}        [description]
     */
    Redshift.prototype._handleSaveError = function(mError) {
      // Something went wrong!
      let oConsole = this.getView().byId("idSaveConsoleTextArea");
      this._populateConsole(mError, oConsole);
    };

    /**
     * [function description]
     * @param  {[type]} mError   [description]
     * @param  {[type]} oConsole [description]
     * @return {[type]}          [description]
     */
    Redshift.prototype._populateConsole = function(vError, oConsole) {
      let sMessage = "";

      if (typeof vError === "object") {
        let mXML = new sap.ui.model.xml.XMLModel();
        mXML.setXML(vError.response.body);
        sMessage = mXML.getProperty("/message").replace(/}.+$/g, "").replace(/^.+{/g, "");
      } else if (typeof vError === "string") {
        sMessage = vError;
      }
      oConsole.setValue(sMessage);
    };

    return Redshift;

  }, /* bExport= */ true);
