jQuery.sap.declare("com.ffa.hpc.view.datasets.CreateHDB");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/datasets/CreateController"],
  function(jQuery, Controller) {
    "use strict";

    var Hdb = Controller.extend("com.ffa.hpc.view.datasets.CreateHDB", /** @lends com.ffa.hpc.view.datasets.CreateHDB.prototype */ {

    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    Hdb.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("hdb").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Hdb.prototype.onExit = function() {};

    /**
     *
     */
    Hdb.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Hdb.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Hdb.prototype._onRouteMatched = function(oEvent) {

      // Testing only
      this._mHana = new sap.ui.model.json.JSONModel({
        id: ShortId.generate(10),
        name: "",
        // name: "HANA dataset",
        host: "",
        // host: "hana.forefrontanalytics.com.au",
        port: null,
        // port: 30015,
        schema: "",
        // schema: "HDITTMER",
        username: "",
        // username: "HDITTMER",
        password: "",
        // password: "H4n4isdumb",
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
     * This handler is used either to advance the configuration page
     * to the next page. When advancing to the next page,
     * we will firstly test the connection. If all goes well, advance.
     * @param  {object} oEvent Button press event
     */
    Hdb.prototype.onNextPress = function(oEvent) {

      var oButton = oEvent.getSource();

      // Validate
      if (!this.validateConnection()) {
        return;
      }

      // set screen to busy
      this.openBusyDialog({
        title: "Connecting",
        text: "Testing your HANA connection - one moment please..."
      });

      // Delayed call, for effect.
      jQuery.sap.delayedCall(1000, this, function() {

        // Promise, so we know when to continue on
        var oPromise = jQuery.Deferred();

        // This is our test done handler. When the test is resolved,
        // it will be run.
        jQuery.when(oPromise).done(jQuery.proxy(function() {

          // Collect the type the user has selected
          var sInflectedType = this.getQueryType(true /* bInflect */ );

          // perform page set up.
          var oPage = this.getView().byId("idPage" + sInflectedType);
          var fn = "setupPage" + sInflectedType;
          if (typeof this[fn] === "function") {
            this[fn].apply(this, []);
          }

          // Button is now bound to the save action
          oButton.detachPress(this.onNextPress, this)
            .attachPress(this.onNextNextPress, this);
          this.getView().byId("idBackButton").setEnabled(true);

          // advance to the next page
          var oNav = this.getView().byId("idNavContainer");
          oNav.to(oPage, "slide");

          // Not busy now
          this.hideBusyDialog();
        }, this));

        // This is our test failed handler. When the test is rejected
        // it will run
        jQuery.when(oPromise).fail(jQuery.proxy(function() {

          // Not busy now
          this.hideBusyDialog();
        }, this));

        // Test HANA; success call back if connection could be made
        this.getView().getModel("dataset").create("/HdbTest", this.getData(), {
          async: true,
          success: jQuery.proxy(function(oData, mResponse) {

            // Handle error with empty, clears Error in the console pane
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
      });
    };

    /**
     * This is the second Next button, and will advance to the definition
     * page, after firstly collecting the table/view/query resultset defintion.
     * @param  {Event} oEvent Button press event
     */
    Hdb.prototype.onNextNextPress = function(oEvent) {

      // Collect button from event source
      var oButton = oEvent.getSource();

      // If this is not a valid select, error.
      if (!this.validateNextNext()) {
        return;
      }

      // set screen to busy
      this.openBusyDialog({
        title: "Reading",
        text: "Reading the query definition - one moment please..."
      });

      // Save the redshift data...
      this.getView().getModel("dataset").create("/Hdb", this.getData(), {
        success: jQuery.proxy(function(oData, mResponse) {

          // Now, we'll retain the sId for this data set, as we'll need it For
          // updating any schema fields, and for setting the date field
          this._sId = oData.id;

          // Button is now bound to the save action
          oButton.detachPress(this.onNextNextPress, this)
            .attachPress(this.onSavePress, this)
            .setText("Save");

          // Back button now goes back only one page, to the previous.
          this.getView().byId("idBackButton").detachPress(this.onBackPress, this)
            .attachPress(this.onBackBackPress, this);

          // Collect the nav container and the next page, and nav
          var oNav = this.getView().byId("idNavContainer");
          var oPage = this.getView().byId("idPageDefinition");
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
            template: sap.ui.xmlfragment("com.ffa.hpc.view.datasets.SchemaField", this)
          });

          // Now we nav...
          oNav.to(oPage, "slide");

          // Not busy any more
          this.closeBusyDialog();
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
     * Saving the data set means checking there is one date field selected. Once
     * this check is validated, we will then check if there are any modifications
     * to the data types. An update of the date dimension is fired, along With
     * updates to any other dimension data types.
     * @param  {object} oEvent Button press event
     */
    Hdb.prototype.onSavePress = function(oEvent) {

      var oButton = oEvent.getSource();

      // set screen to busy
      this.openBusyDialog({
        title: "Saving",
        text: "Saving your HANA configuration - one moment please..."
      });

      // Save the date field
      this.saveDateField(
        jQuery.proxy(function(oData, mResponse) {

          // Refresh the dataset listing by raising an event (subscribers will do
          // the work)
          this.getEventBus().publish("Detail", "RefreshMaster", {});

          // Update the screen, then close.
          this.updateBusyDialog({
            text: "All done! Finishing up..."
          });

          // Timed close.
          jQuery.sap.delayedCall(1500, this, function() {

            // Send the nav container back to start
            try {
              this.getView().byId("idNavContainer").backToTop();
            } catch (e) {}

            // Reset the Next buttons
            oButton.detachPress(this.onSavePress, this)
              .attachPress(this.onNextPress, this)
              .setText("Next");

            // Reset the back buttons
            this.getView().byId("idBackButton").detachPress(this.onBackBackPress, this)
              .attachPress(this.onBackPress, this)
              .setEnabled(false);

            // Reset all form values
            this.clearForms(["idHanaConfigForm", "idHanaTestConsoleForm", "idHanaQueryForm", "idHanaConsoleForm", "idViewForm", "idTableForm"]);

            // NOt busy any more
            this.closeBusyDialog();

            // Navigate to the new data set...
            this.getRouter().navTo("view-hdb", {
              dataset_id: this._sId
            }, !sap.ui.Device.system.phone);
          });
        }, this),

        jQuery.proxy(function(mError) {
          // NOt busy any more
          this.closeBusyDialog();
        }, this)
      );
    };

    /**
     * The back button takes us back a page, but we need to determine if it's
     * at the every beginning or not. We also need to update what happens
     * to the Next button.
     * @param  {object} oEvent Button press event
     */
    Hdb.prototype.onBackPress = function(oEvent) {
      // Next button is now a next button
      var oButton = this.getView().byId("idNextButton");
      oButton.detachPress(this.onNextNextPress, this)
        .attachPress(this.onNextPress, this)
        .setText("Next");

      // Set back button disabled
      oEvent.getSource().setEnabled(false);

      // clear the combobox...
      this.getView().byId("idViewsComboBox").setValue("");
      this.getView().byId("idTablesComboBox").setValue("");

      // Head back, boi!
      var sPageId = this.getView().createId("idPageStart");
      this.getView().byId("idNavContainer").backToPage(sPageId);
    };

    /**
     * When we are on the third/last page, the back button has a special role
     * to play. It is only taking us back one page, but it must be to the
     * correct page (either of table, view, or query).
     * @param  {object} oEvent Button press event
     */
    Hdb.prototype.onBackBackPress = function(oEvent) {

      // Now the back button only needs to go back to the start page, so Update
      // the handler accordingly
      oEvent.getSource().detachPress(this.onBackBackPress, this)
        .attachPress(this.onBackPress, this);

      // Button is now bound to the save action
      this.getView().byId("idNextButton").detachPress(this.onSavePress, this)
        .attachPress(this.onNextNextPress, this)
        .setText("Next");

      // Collect the type the user has selected
      var sInflectedType = this.getQueryType(true /* bInflect */ );

      // Use promises to holdup cancellation until deletion occurs
      var oPromise = jQuery.Deferred();
      jQuery.when(oPromise).then(jQuery.proxy(function() {
        // Clear out sId
        this._sId = undefined;

        // Head back, boi!
        var sPageId = this.getView().createId("idPage" + sInflectedType);
        this.getView().byId("idNavContainer").backToPage(sPageId);
      }, this))

      // We may need to delete the just created data set...
      if (this._sId) {
        this.delete(this._sId, oPromise);
      } else {
        oPromise.resolve();
      }
    };

    /**
     * User is cancelling the creation process. We need to delete any created
     * resources, reset all button handlers and text, nav back to the top page
     * @param  {Event} oEvent Button press event
     */
    Hdb.prototype.onCancelPress = function(oEvent) {
      // nav back to main Page
      try {
        this.getView().byId("idNavContainer").back();
      } catch (e) {}

      // Use promises to holdup cancellation until deletion occurs
      var oPromise = jQuery.Deferred();
      jQuery.when(oPromise).then(jQuery.proxy(function() {
        // Clear out sId
        this._sId = undefined;

        // Clear all input fields of all forms.
        this.clearForms(["idHanaConfigForm", "idHanaTestConsoleForm", "idHanaQueryForm", "idHanaConsoleForm", "idViewForm", "idTableForm"]);

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
    Hdb.prototype.validateConnection = function() {

      // Valid
      var bValid = true;

      // get all mandatory fields and check their state
      this.getMandtControls().forEach(function(c, i) {
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
     * Checks the save screen for validity. This is of course dependent on the
     * screen displayed, so we must check the Query type before applying the
     * correct validation technique. Tables/Views/Query are the three possibilities
     * @return {boolean} Is valid?
     */
    Hdb.prototype.validateNextNext = function() {

      // Valid
      var bValid = true;

      // Control stub
      var control = jQuery.proxy(this.control, this);

      // For tables, validate using tables. etc.
      switch (this.getQueryType(false)) {
        case 'tables':
          // Check if the tables combo box is populated with a valid entry
          bValid = this.validateTables();
          break;
        case 'views':
          bValid = this.validateViews();
          break;
        case 'query':
          bValid = this.validateQuery(control("idQueryTextArea"));
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
    Hdb.prototype.getMandtControls = function() {
      // Shortcut
      var control = jQuery.proxy(this.control, this);
      return [
        control("idNameInput"),
        control("idHostInput"),
        control("idPortInput"),
        control("idSchemaInput")
      ];
    };

    /**
     * When one of the mandatory input controls is changed, we validate immediately
     * to (primarily) remove an error state, if one exists. All validation is run
     * again when trying to progress.
     * @param  {event} oEvent Change Event
     */
    Hdb.prototype.onInputChange = function(oEvent) {

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
    Hdb.prototype.setupPageQuery = function() {

      // set screen to busy
      this.openBusyDialog({
        title: "Connecting",
        text: "Testing your Redshift connection - one moment please..."
      });

      // Test redshift; success call back if connection could be made
      this.getView().getModel("dataset").create("/HdbTest", this.getData(), {
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
    Hdb.prototype.onQueryPress = function(oEvent) {
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
      this.getView().getModel("dataset").create("/HdbTest", this.getData(), {
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
     * Validates the query text in the supplied control. Basically, we're
     * checking to make sure that there are no modification SQL operations in
     * the text. This same check is performed in the back-end, so there's no
     * getting around it.
     * @param  {[type]} oControl [description]
     * @return {[type]}          [description]
     */
    Hdb.prototype.validateQuery = function(oControl) {

      // Valid
      var bValid = true;

      var oTextArea = oControl || this.control("idQueryTextArea");
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
     * Validates the query text in the supplied control. Basically, we're
     * checking to make sure that there are no modification SQL operations in
     * the text. This same check is performed in the back-end, so there's no
     * getting around it.
     * @param  {[type]} oControl [description]
     * @return {[type]}          [description]
     */
    Hdb.prototype.validateQuery = function(oControl) {

      // Valid
      var bValid = true;

      var oTextArea = oControl || this.control("idQueryTextArea");
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
     * Set up the views page; here, we are binding the list to the HdbEntities.
     * We also supply a search box, to filter on.
     */
    Hdb.prototype.setupPageViews = function() {
      //this.bindEntityComboBox(this.getView().byId("idViewsComboBox"));
      // Previously we were showing all views in a dropdown ComboBox; the issue
      // with a combo box is that it's limited in size, according to the model's
      // max record parameter. We don't really want to change the max read size
      // of the entire model, so using a list table means we can utilise growing
      // attributes to our needs.
      var oList = this.getView().byId("idViewSearchList");

      // Note, that because the connection attempt to database also populates
      // the entities on the basis of the view/table selection, we can
      // safely query the entities table without worrying about whether
      // we're looking at tables or views.
      oList.bindItems({
        path: 'dataset>/HdbEntities',
        filters: [new sap.ui.model.Filter({
          path: 'profile_id',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: 'TESTUSER' // binding to only our user's listings
        }), new sap.ui.model.Filter({
          path: 'schema',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: this.getView().byId("idSchemaInput").getValue().toUpperCase()
        })],
        template: new sap.m.StandardListItem({
          title: "{dataset>entity}"
        })
      });
    };

    /**
     * Validates the user's selection on the Views screen. Must make sure
     * that a list item has been selected from the views list.
     * @return {boolean}          Is valid?
     */
    Hdb.prototype.validateViews = function() {

      // Selected list item.
      var oItem = this.getView().byId("idViewSearchList").getSelectedItem();
      if(oItem) {
        return true;
      }

      this.showErrorAlert("Please select view to continue.");
      return false;
    };

    /**
     * When the search button/reset button is pressed, this handler will either
     * reset the search, or apply the search term to the list of Hdb view entities.
     * @param  {Event} oEvent Press event
     */
    Hdb.prototype.onViewSearch = function (oEvent) {
      var sQuery = oEvent.getParameter("query"),
        bRefresh = oEvent.getParameter("refreshButtonPressed");

      // Refresh case.
      if (bRefresh) {
        // Clear the search, and reset the filter.
        sQuery = "";
      }

      // Now, we'll filter the list.
			var aFilters = [];
      if (sQuery) {
        var filter = new sap.ui.model.Filter({
          path : "entity",
          operator: sap.ui.model.FilterOperator.Contains,
          value1 : sQuery
        });
  			aFilters.push(filter);
      }

			// update list binding
			var oList = this.getView().byId("idViewSearchList");
			list.getBinding("items").filter(aFilters, "Application");
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
    Hdb.prototype.setupPageTables = function() {
      // Bind the page to the Redshift Id
      //this.bindEntityComboBox(this.getView().byId("idTablesComboBox"));
      var oList = this.getView().byId("idTableSearchList");

      // Note, that because the connection attempt to database also populates
      // the entities on the basis of the view/table selection, we can
      // safely query the entities table without worrying about whether
      // we're looking at tables or views.
      oList.bindItems({
        path: 'dataset>/HdbEntities',
        filters: [new sap.ui.model.Filter({
          path: 'profile_id',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: 'TESTUSER' // binding to only our user's listings
        }), new sap.ui.model.Filter({
          path: 'schema',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: this.getView().byId("idSchemaInput").getValue().toUpperCase()
        })],
        template: new sap.m.StandardListItem({
          title: "{dataset>entity}"
        })
      });
    };
    /**
     * Validates the user's selection on the Views screen. Must make sure
     * that a list item has been selected from the views list.
     * @return {boolean}          Is valid?
     */
    Hdb.prototype.validateTables = function() {

      // Selected list item.
      var oItem = this.getView().byId("idTableSearchList").getSelectedItem();
      if(oItem) {
        return true;
      }

      this.showErrorAlert("Please select table to continue.");
      return false;
    };

    /**
     * When the search button/reset button is pressed, this handler will either
     * reset the search, or apply the search term to the list of Hdb table entities.
     * @param  {Event} oEvent Press event
     */
    Hdb.prototype.onTableSearch = function (oEvent) {
      var sQuery = oEvent.getParameter("query"),
        bRefresh = oEvent.getParameter("refreshButtonPressed");

      // Refresh case.
      if (bRefresh) {
        // Clear the search, and reset the filter.
        sQuery = "";
      }

      // Now, we'll filter the list.
			var aFilters = [];
      if (sQuery) {
        var filter = new sap.ui.model.Filter({
          path : "entity",
          operator: sap.ui.model.FilterOperator.Contains,
          value1 : sQuery
        });
  			aFilters.push(filter);
      }

			// update list binding
			var oList = this.getView().byId("idTableSearchList");
			list.getBinding("items").filter(aFilters, "Application");
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
    Hdb.prototype._handleTestError = function(mError) {
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
    Hdb.prototype._handleSaveError = function(mError) {
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
    Hdb.prototype._populateConsole = function(vError, oConsole) {
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
    Hdb.prototype.onHelpPress = function(oEvent) {
      // show the query type help pop-up
      alert("Help!");
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
    Hdb.prototype.getData = function() {

      // We'll need this in our local function
      var oView = this.getView();

      // For selecting the entity property of either the view/table list.
      var getSelectedItemEntity = function(sListId) {
        var oList = oView.byId(sListId);
        var oItem = oList.getSelectedItem();

        // Just in case this is called and either the list is not populated,
        // or nothing is selected.
        if (!oItem) {
          return "";
        }

        // Now we'll continue.
        var oBinding = oItem.getBinding("dataset");
        return oBinding.getProperty("entity");
      };

      // This function is used to collect the value from a text field
      var value = jQuery.proxy(this._value, this);

      // return
      var oData = {
        id: ShortId.generate(10),
        name: value("idNameInput"),
        host: value("idHostInput"),
        port: parseInt(value("idPortInput"), 10),
        username: value("idUsernameInput"),
        password: value("idPasswordInput"),
        schema: value("idSchemaInput").toUpperCase(),
        remember: value("idRememberCheckBox"),
        created_by: this.getProfileId(),
        query: "",
        query_type: value("idQueryMethodSelect")
      };

      // In addition to the base data, we also need to include the table/view/SQL
      // we're going to query with. This is sufficient to simply grab the view/table
      // name, because when the record is saved, the query type is specified. So we
      // know to build a HANA select using the table/view. Wrap in a try/catch
      // incase the secondary page hasn't rendered yet.
      try {
        switch (this.getQueryType(false)) {
          case 'tables':
            oData.query = getSelectedItemEntity("idTableSearchList");
            break;
          case 'views':
            oData.query = getSelectedItemEntity("idViewSearchList");
            break;
          case 'query':
            var sQuery = value("idQueryTextArea").trim();
            // if the Query ends with a semi-colon, remove it...
            if (sQuery.charAt(sQuery.length-1) === ";") {
              sQuery = sQuery.substring(0, sQuery.length-1);
            }
            oData.query = sQuery;
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
    Hdb.prototype.getQueryType = function(bInflect) {
      var sType = this.getView().byId("idQueryMethodSelect").getSelectedKey();
      return (bInflect ? sType.charAt(0).toUpperCase() + sType.slice(1) : sType.toLowerCase());
    };

    return Hdb;

  }, /* bExport= */ true);
