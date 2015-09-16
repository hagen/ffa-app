jQuery.sap.declare("view.data.Redshift");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/Controller"],
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
        remember: true,
        query: "",
        created_by: this.getUserId(),
        query_type: ""
      });

      this._mRedshift.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
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
     *
     * @param  {object} oEvent Button press event
     */
    Redshift.prototype.onBackPress = function(oEvent) {
      // Button is now bound to the save action
      var oButton = this.getView().byId("idNextButton");
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
    Redshift.prototype.onNextPress = function(oEvent) {

      // Validate
      if (!this._validateConnection()) {
        return;
      }

      // Now continue processing
      var oButton = oEvent.getSource();

      // set screen to busy
      this.openBusyDialog({
        title: "Connecting",
        text: "Testing your Redshift connection - one moment please..."
      });

      // Delayed call, for effect.
      jQuery.sap.delayedCall(1000, this, function() {

        // Promise, so we know when to continue on
        var oPromise = jQuery.Deferred();

        // Depending on the state of the promise, after we try and connect,
        // execute one of the done/fail deferred options
        jQuery.when(oPromise).done(jQuery.proxy(function() {

          // Collect the type the user has selected
          var sInflectedType = this._getQueryType(true /* bInflected */ );

          // perform page set up.
          var oPage = this.getView().byId("idPage" + sInflectedType);
          var fn = "setupPage" + sInflectedType;
          if (typeof this[fn] === "function") {
            this[fn].apply(this, []);
          }

          // Button is now bound to the save action
          oButton.detachPress(this.onNextPress, this)
            .attachPress(this.onSavePress, this)
            .setText("Save");
          this.getView().byId("idBackButton").setEnabled(true);

          // advance to the next page
          var oNav = this.getView().byId("idNavContainer");
          oNav.to(oPage, "slide");

          // Not busy now
          this.hideBusyDialog();
        }, this)).fail(jQuery.proxy(function() {

          this.hideBusyDialog();
        }, this));

        // Now try and connect
        this._connect(oPromise);
      });
    };

    /**
     * Run the query against the redshift connection.
     * @param  {event} oEvent Button press event
     */
    Redshift.prototype.onQueryPress = function(oEvent) {
      // Check the user has entered a query...
      if (!this._validateQuery()) {
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

    /**
     * This handler is used either to advance the configuration page
     * to the query page, or save the query. When advancing to the next page,
     * we will firstly test the connection. If all goes well, update the text
     * for this button to 'Save'.
     * @param  {object} oEvent Button press event
     */
    Redshift.prototype.onSavePress = function(oEvent) {

      // Check that the user has selected a view/table
      if (!this._validateSave()) {
        return;
      }

      // set screen to busy
      this.openBusyDialog({
        title: "Saving",
        text: "Saving your Redshift dataset - one moment please..."
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

            // Send the Redshift nav container back to start
            try {
              this.getView().byId("idNavContainer").back();
            } catch (e) {}

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
     *     ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗
     *    ██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
     *    ██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║
     *    ██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║
     *    ╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
     *     ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    /**
     * Tests the user's details to connect to the postgresql database.
     * @param  {Deferred} oPromise The promise to either resolve or reject
     */
    Redshift.prototype._connect = function(oPromise) {

      // Test redshift; success call back if connection could be made
      this.getView().getModel("dataset").create("/RedshiftTest", this._getData(), {
        async: true,
        success: jQuery.proxy(function(oData, mResponse) {

          // Handle error with empty, clears Error
          this._handleTestError();

          // Cool to continue
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {

          // Handle connection test errors
          this._handleTestError(mError);

          // Reject the promise
          oPromise.reject();
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
     * Retrieves data from the model, does some formatting, and returns.
     * @return {object} OData object
     */
    Redshift.prototype._getData = function() {

      var value = jQuery.proxy(this._value, this);

      // Build the payload
      var oData = {
        id: ShortId.generate(10),
        name: value("idRedshiftNameInput"),
        endpoint: value("idRedshiftEndpointInput"),
        port: parseInt(value("idRedshiftPortInput"), 10),
        database: value("idRedshiftDatabaseInput"),
        username: value("idRedshiftUsernameInput"),
        password: value("idRedshiftPasswordInput"),
        remember: value("idRedshiftRememberPasswordCheckBox"),
        query_type: value("idQueryMethodSelect"),
        query: value("idQueryTextArea"),
        created_by: this.getUserId()
      };

      // In addition to the base data, we also need to include the table/view/SQL
      // we're going to query with. This is sufficient to simply grab the view/table
      // name, because when the record is saved, the query type is specified. So we
      // know to build a Redshift select using the table/view. Wrap in a try/catch
      // incase the secondary page hasn't rendered yet.
      try {
        switch (this._getQueryType(false)) {
          case 'tables':
            oData.query = value("idTablesComboBox");
            break;
          case 'views':
            oData.query = value("idViewsComboBox");
            break;
          case 'query':
            oData.query = value("idQueryTextArea");
            break;
        }
      } catch (e) {
        oData.query = "";
      }

      // Return
      return oData;
    };

    /**
     * Gets the selected query type from the dropdown. This has a separate function
     * as we use this value often. Also, optionally returns inflected
     * @return {[type]} [description]
     */
    Redshift.prototype._getQueryType = function(bInflect) {
      var sType = this.getView().byId("idQueryMethodSelect").getSelectedKey();
      return (bInflect ? sType.charAt(0).toUpperCase() + sType.slice(1) : sType.toLowerCase());
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
     * Validates the connection details entered on the first screen.
     * If required fields are not supplied, then the user cannot progress
     * to the next screen.
     * @return {boolean} Is the screen valid?
     */
    Redshift.prototype._validateConnection = function() {

      // Valid
      var bValid = true;

      // get all mandatory fields and check their state
      this._getMandtControls().forEach(function(c, i) {
        if (c.getValue() === "") {
          bValid = false;
          c.setValueState(sap.ui.core.ValueState.Error);
          c.setValueStateText(c.data("error"));
        } else {
          c.setValueState(sap.ui.core.ValueState.None);
        }
      });

      return bValid;
    };

    /**
     * Validates the query text in the supplied control. Basically, we're
     * checking to make sure that there are no modification SQL operations in
     * the text. This same check is performed in the back-end, so there's no
     * getting around it.
     * @param  {[type]} oControl [description]
     * @return {[type]}          [description]
     */
    Redshift.prototype._validateQuery = function(oControl) {

      // Valid
      var bValid = true;

      var oTextArea = oControl || this._control("idQueryTextArea");
      var sQuery = oTextArea.getValue().toLowerCase();
      var pattern = /^(update|delete|insert|alter|create)(.*)(;)$/i;

      // Now checking
      if (sQuery === "" || !sQuery) {
        oTextArea.setValueState(sap.ui.core.ValueState.Error);
        oTextArea.setValueStateText("Your query is empty. Please supply an SQL query to run.");
        bValid = false;
      } else if (pattern.test(sQuery)) {
        oTextArea.setValueState(sap.ui.core.ValueState.Error);
        oTextArea.setValueStateText("Cheeky! We're reading data... so only SELECT statements are permitted.");
        bValid = false;
      } else {
        oTextArea.setValueState(sap.ui.core.ValueState.None);
        bValid = true;
      }

      return bValid;
    };

    /**
     * Validates the table selection screen. This is working on the presumption
     * that the user is picking a table from the list returned. If no tables
     * are returned, then they're not able to progress past this screen.
     * @param  {Control} oControl The ComboBox table listing control
     * @return {boolean}          Is valid?
     */
    Redshift.prototype._validateTables = function(oControl) {

      // Valid
      var bValid = true;

      // Now we can do the checking
      var oComboBox = oControl || this.control("idTablesComboBox");
      if (oComboBox.getSelectedKey() === "" || !oComboBox.getSelectedKey()) {
        oComboBox.setValueState(sap.ui.core.ValueState.Error);
        oComboBox.setValueStateText("Please pick only from the available tables");
        return false;
      } else {
        oComboBox.setValueState(sap.ui.core.ValueState.None);
        return true;
      }

      return bValid;
    };

    /**
     * Validates the user's selection on the Views screen. Again, presumption is
     * that they've got views to select from. If none are selected, not going
     * anywhere
     * @param  {Control} oControl The ComboBox control
     * @return {boolean}          Is valid?
     */
    Redshift.prototype._validateViews = function(oControl) {

      // Valid
      var bValid = true;

      // Now we can do the checking
      var oComboBox = oControl || this.control("idViewsComboBox");
      if (oComboBox.getSelectedKey() === "" || !oComboBox.getSelectedKey()) {
        oComboBox.setValueState(sap.ui.core.ValueState.Error);
        oComboBox.setValueStateText("Please pick only from the available views");
        return false;
      } else {
        oComboBox.setValueState(sap.ui.core.ValueState.None);
        return true;
      }

      return bValid;
    };

    /**
     * Checks the save screen for validity. This is of course dependent on the
     * screen displayed, so we must check the Query type before applying the
     * correct validation technique. Tables/Views/Query are the three possibilities
     * @return {boolean} Is valid?
     */
    Redshift.prototype._validateSave = function() {

      // Valid
      var bValid = true;

      // Control stub
      var control = jQuery.proxy(this._control, this);

      // For tables, validate using tables. etc.
      switch (this._getQueryType(false)) {
        case 'tables':
          // Check if the tables combo box is populated with a valid entry
          bValid = this._validateTables(control("idTablesComboBox"));
          break;
        case 'views':
          bValid = this._validateViews(control("idViewsComboBox"));
          break;
        case 'query':
          bValid = this._validateQuery(control("idQueryTextArea"));
          break;
      }
      return bValid;
    };

    /**
     * We get the mandatory controls, which are not defined in configuration,
     * but rather static rules here. There are four mandatory fields for Save
     * which are name, endpoint, port and database.
     * @return {Array} All mandatory controls in array
     */
    Redshift.prototype._getMandtControls = function() {
      // Shortcut
      var control = jQuery.proxy(this._control, this);
      return [
        control("idRedshiftNameInput"),
        control("idRedshiftEndpointInput"),
        control("idRedshiftPortInput"),
        control("idRedshiftDatabaseInput")
      ];
    };

    /**
     * When one of the mandatory input controls is changed, we validate immediately
     * to (primarily) remove an error state, if one exists. All validation is run
     * again when trying to progress.
     * @param  {event} oEvent Change Event
     */
    Redshift.prototype.onInputChange = function(oEvent) {

      // Validate onChange value
      var oControl = oEvent.getSource();
      var sValue = oEvent.getParameter("value");

      if (sValue === "" || !sValue) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText(oControl.data("error"));
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
      }
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
    Redshift.prototype.setupPageQuery = function() {

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

    /***
     *    ██╗   ██╗██╗███████╗██╗    ██╗███████╗
     *    ██║   ██║██║██╔════╝██║    ██║██╔════╝
     *    ██║   ██║██║█████╗  ██║ █╗ ██║███████╗
     *    ╚██╗ ██╔╝██║██╔══╝  ██║███╗██║╚════██║
     *     ╚████╔╝ ██║███████╗╚███╔███╔╝███████║
     *      ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚══════╝
     *
     */

    /**
     * Set up the views page
     * @return {[type]} [description]
     */
    Redshift.prototype.setupPageViews = function() {
      this._bindEntityComboBox(this.getView().byId("idViewsComboBox"));
    };

    /***
     *    ████████╗ █████╗ ██████╗ ██╗     ███████╗███████╗
     *    ╚══██╔══╝██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝
     *       ██║   ███████║██████╔╝██║     █████╗  ███████╗
     *       ██║   ██╔══██║██╔══██╗██║     ██╔══╝  ╚════██║
     *       ██║   ██║  ██║██████╔╝███████╗███████╗███████║
     *       ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚══════╝
     *
     */

    /**
     * Set up the views page
     * @return {[type]} [description]
     */
    Redshift.prototype.setupPageTables = function() {
      // Bind the page to the Redshift Id
      this._bindEntityComboBox(this.getView().byId("idTablesComboBox"));
    };

    /**
     * Bind the supplied Combo box to the list of entities for this Redshift database
     * @param  {[type]} oComboBox [description]
     * @return {[type]}           [description]
     */
    Redshift.prototype._bindEntityComboBox = function(oComboBox) {
      oComboBox.bindItems({
        path: 'dataset>/RedshiftEntities',
        filters: [new sap.ui.model.Filter({
          path: 'profile_id',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: 'TESTUSER'
        }), new sap.ui.model.Filter({
          path: 'database',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: this.getView().getModel("redshift").getProperty("/database")
        })],
        template: new sap.ui.core.Item({
          key: "{dataset>entity}",
          text: "{dataset>entity}"
        })
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
    Redshift.prototype._handleTestError = function(mError) {
      // Something went wrong!
      var oConsole = this.getView().byId("idTestConsoleTextArea");
      if (!mError) {
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
    Redshift.prototype._handleSaveError = function(mError) {
      // Something went wrong!
      var oConsole = this.getView().byId("idSaveConsoleTextArea");
      this._populateConsole(mError, oConsole);
    };

    /**
     * [function description]
     * @param  {[type]} mError   [description]
     * @param  {[type]} oConsole [description]
     * @return {[type]}          [description]
     */
    Redshift.prototype._populateConsole = function(vError, oConsole) {
      var sMessage = "";

      if (typeof vError === "object") {
        var mXML = new sap.ui.model.xml.XMLModel();
        mXML.setXML(vError.response.body);
        sMessage = mXML.getProperty("/message").replace(/}.+$/g, "").replace(/^.+{/g, "");
      } else if (typeof vError === "string") {
        sMessage = vError;
      }
      oConsole.setValue(sMessage);
    };

    /***
     *    ██╗  ██╗███████╗██╗     ██████╗
     *    ██║  ██║██╔════╝██║     ██╔══██╗
     *    ███████║█████╗  ██║     ██████╔╝
     *    ██╔══██║██╔══╝  ██║     ██╔═══╝
     *    ██║  ██║███████╗███████╗██║
     *    ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝
     *
     */

    /**
     * Help icon button press event
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Redshift.prototype.onHelpPress = function (oEvent) {
      // show the query type help pop-up
      alert("Help!");
    };

    return Redshift;

  }, /* bExport= */ true);
