jQuery.sap.declare("view.data.Hana");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Hana = Controller.extend("view.data.Hana", /** @lends view.data.Hana.prototype */ {

    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    Hana.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("hana").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Hana.prototype.onExit = function() {};

    /**
     *
     */
    Hana.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Hana.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Hana.prototype._onRouteMatched = function(oEvent) {

      // Testing only
      this._mHana = new sap.ui.model.json.JSONModel({
        id: ShortId.generate(10),
        name: "HANA dataset",
        host: "hana.forefrontanalytics.com.au",
        port: 30015,
        username: "HDITTMER",
        password: "H4n4isdumb",
        remember: false,
        query: "",
        created_by: this.getUserId()
      });

      this.getView().setModel(this._mHana, "hana");
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
    Hana.prototype.onCancelPress = function(oEvent) {
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
    Hana.prototype.onNextPress = function(oEvent) {

      let oButton = oEvent.getSource();

      // set screen to busy
      this.openBusyDialog({
        title: "Connecting",
        text: "Testing your HANA connection - one moment please..."
      });

      // Delayed call, for effect.
      jQuery.sap.delayedCall(1000, this, function() {

        // We always need to test the connection. So do this now.
        if(!this._test()) {
          // Not busy now
          this.hideBusyDialog();
          return;
        }

        // Collect the type the user has selected
        let sType = this.getView().byId("idQueryMethodSelect").getSelectedKey();
        let sInflectedType = sType.charAt(0).toUpperCase() + sType.slice(1);

        // perform page set up.
        let oPage = this.getView().byId("idPage" + sInflectedType);
        let fn = "setupPage" + sInflectedType;
        if (typeof this[fn] === "function") {
          this[fn].apply(this, []);
        }

        // Button is now bound to the save action
        oButton.detachPress(this.onNextPress, this)
                .attachPress(this.onSavePress, this)
                .setText("Save");
        this.getView().byId("idBackButton").setEnabled(true);

        // advance to the next page
        let oNav = this.getView().byId("idNavContainer");
        oNav.to(oPage, "slide");

        // Not busy now
        this.hideBusyDialog();
      });
    };

    /**
     *
     * @param  {object} oEvent Button press event
     */
    Hana.prototype.onBackPress = function(oEvent) {
      // Button is now bound to the save action
      let oButton = this.getView().byId("idNextButton");
      oButton.detachPress(this.onSavePress, this)
              .attachPress(this.onNextPress, this)
              .setText("Next");

      // Set back button disabled
      oEvent.getSource().setEnabled(false);

      // Head back, boi!
      this.getView().byId("idNavContainer").back();
    };

    /**
     * This handler is used either to advance the configuration page
     * to the query page, or save the query. When advancing to the next page,
     * we will firstly test the connection. If all goes well, update the text
     * for this button to 'Save'.
     * @param  {object} oEvent Button press event
     */
    Hana.prototype.onSavePress = function(oEvent) {

      // set screen to busy
      this.openBusyDialog({
        title: "Saving",
        text: "Saving your Redshift configuration - one moment please..."
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
     * Tests the user's details to connect to the postgresql database.
     * @return {[type]} [description]
     */
    Hana.prototype._test = function() {

      let bContinue = false;

      // Test redshift; success call back if connection could be made
      this.getView().getModel("dataset").create("/RedshiftTest", this._getData(), {
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {

          // Handle error with empty, clears Error
          this._handleTestError();

          bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          // Handle connection test errors
          this._handleTestError(mError);

          // not busy any more
          this.closeBusyDialog();
        }, this)
      });

      return bContinue;
    };

    /**
     * Given the name and key input fields, this checks they both have a value,
     * and if one does not, then an error is displayed.
     * @param  {[type]} oNameInput [description]
     * @param  {[type]} oKeyInput  [description]
     * @return {[type]}            [description]
     */
    Hana.prototype._validate = function() {

    };

    /**
     * Retrieves data from the model, does some formatting, and returns.
     * @return {object} OData object
     */
    Hana.prototype._getData = function() {

      let self = this;

      let get = function get(sId) {
        let oControl = self.getView().byId(sId);
        if (oControl instanceof sap.m.CheckBox) {
          return (oControl.getSelected() ? 'X' : ' ');
        } else if (oControl instanceof sap.m.Select){
          return oControl.getSelectedKey();
        } else {
          return oControl.getValue();
        }
      };

      // return
      return {
        id : ShortId.generate(10),
        name : get("idRedshiftNameInput"),
        endpoint : get("idRedshiftEndpointInput"),
        port : parseInt(get("idRedshiftPortInput"), 10),
        database : get("idRedshiftDatabaseInput"),
        username : get("idRedshiftUsernameInput"),
        password : get("idRedshiftPasswordInput"),
        remember : get("idRedshiftRememberPasswordCheckBox"),
        query_type : get("idQueryMethodSelect"),
        query : "",
        created_by: this.getUserId()
      };
    };

    /***
     *     ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗
     *    ██╔═══██╗██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝
     *    ██║   ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝
     *    ██║▄▄ ██║██║   ██║██╔══╝  ██╔══██╗  ╚██╔╝
     *    ╚██████╔╝╚██████╔╝███████╗██║  ██║   ██║
     *     ╚══▀▀═╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝
     *
     */

    /**
     * Set up the views page
     * @return {[type]} [description]
     */
    Hana.prototype.setupPageQuery = function() {

      // set screen to busy
      this.openBusyDialog({
        title: "Connecting",
        text: "Testing your Redshift connection - one moment please..."
      });

      // Test redshift; success call back if connection could be made
      this.getView().getModel("dataset").create("/RedshiftTest", this._getData(), {
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {

          // Handle error with empty, clears Error
          this._handleTestError();
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
     * Run the query against the redshift connection.
     * @param  {event} oEvent Button press event
     */
    Hana.prototype.onQueryPress = function(oEvent) {
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
    Hana.prototype._handleTestError = function(mError) {
      // Something went wrong!
      let oConsole = this.getView().byId("idTestConsoleTextArea");
      if(!mError) {
        oConsole.setValue("Console...");
      } else {
        this._populateConsole(mError, oConsole);
      }
    };

    /**
     * Handles connection error
     * @param  {[type]} mError [description]
     * @return {[type]}        [description]
     */
    Hana.prototype._handleSaveError = function(mError) {
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
    Hana.prototype._populateConsole = function(vError, oConsole) {
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

    return Hana;

  }, /* bExport= */ true);
