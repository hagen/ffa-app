jQuery.sap.declare("view.forecasts.ForecastWizard");
jQuery.sap.require("thirdparty.shortid.ShortId");
jQuery.sap.require("util.DateFormatter");

// Provides controller forecasts.ForecastWizard
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var ForecastWizard = Controller.extend("view.forecasts.ForecastWizard", /** @lends view.forecasts.ForecastWizard.prototype */ {

    });

    /**
     * On init handler
     */
    ForecastWizard.prototype.onInit = function() {
      // Our folder Id globals
      this._sFolderId = "";
      this._iStep = 1;
      this._aBatchOps = [];
      this._oFields = {
        date: "",
        forecast: "",
        variables: []
      };

      // handle route matched
      this.getRouter().getRoute("new-forecast-from-folder").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    ForecastWizard.prototype.onExit = function() {};

    /**
     * Before rendering, set up required icons
     */
    ForecastWizard.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    ForecastWizard.prototype.onAfterRendering = function() {;
    };

    /**
     * Route matched handler
     * @param  {object} oEvent Route matched event
     */
    ForecastWizard.prototype._onRouteMatched = function(oEvent) {
      // Couple of scenarios...
      // (1) arrive here from folders - Create New Forecast; if so, retain
      // parent folder Id
      // (2) arrive here from all forecasts
      var oParameters = oEvent.getParameters();
      if (oParameters.name.indexOf("folder") === -1) {
        return;
      }

      // Arrived here from folders.
      this._sOrigin = "folders";
      this._sFolderId = (oParameters.arguments.folder_id ? oParameters.arguments.folder_id : "");

      // We'll need to bind the directory input to the folder name, if there is one.
      var oInput = this.getView().byId("idNewForecastFolderInput");
      if (this._sFolderId !== "") {
        oInput.bindElement({
          path: "/Folders('" + this._sFolderId + "')",
          model: "forecast"
        }).bindValue({
          path: "name",
          model: "forecast"
        });
      } else {
        oInput.setValue("/");
      }

      // and run setup for step one.
      this.setupStep1();

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("Folders", "RouteMatched", {} /* payload */ );
    };

    /**
     * Navigate within the NavContainer backwards (no routing occurs here)
     * @param  {object} oEvent Button press event
     */
    ForecastWizard.prototype.onNavBackPress = function(oEvent) {
      // Decrement step
      this._iStep--;

      // Nav back
      this.getView().byId("idForecastWizardNavContainer").back();
    };

    /**
     * When the Wizard Cancel button is pressed, we navigate back to either the
     * parent folder, or our Forecast listing.
     * @param  {object} oEvent Button press event
     */
    ForecastWizard.prototype.onCancelWizardPress = function(oEvent) {
      var sRoute = "";
      var oArgs = {};

      // if we came here from the folders route, go back...
      if (this._sOrigin === "folders") {
        sRoute = "folders";
        oArgs.folder_id = (this._sFolderId ? this._sFolderId : "");
      } else {
        sRoute = "forecasts";
      }

      // Navigate!
      this.getRouter().navTo(sRoute, oArgs, !sap.ui.Device.system.phone);

      // We also need to send the wizard back to page 1
      this.getView().byId("idForecastWizardNavContainer").backToPage(this.getView().createId("idNewForecastWizardPage1"));
    };

    /**
     * When the Wizard Next button is pressed, we perform validation checks
     * then navigate to the next page
     * @param  {object} oEvent Button press event
     */
    ForecastWizard.prototype.onNextWizardPress = function(oEvent) {

      // Validate the details in the step.
      // If all checks are passed, then go to the next view.
      if (!this["validateStep" + this._iStep].apply(this, [])) {
        return;
      }

      // Next step!
      this._iStep++;

      // and page
      var sPage = "idNewForecastWizardPage" + this._iStep;

      // Perform optional page set up.
      try {
        var oPromise = this["setupStep" + this._iStep].apply(this, []);
        // when the promise is resolved, we can navigate.
        jQuery.when(oPromise).then(jQuery.proxy(function() {
          // Navigate to the next view
          this.getView().byId("idForecastWizardNavContainer").to(this.getView().byId(sPage))
        }, this));
      } catch (e) {
        // No setup step. Navigate immediately
        this.getView().byId("idForecastWizardNavContainer").to(this.getView().byId(sPage))
      }
    };

    /**
     * Shows a busy dialog, with the supplied title and text. no Cancel button is shown
     * so this dialog needs to be programmatically closed.
     * @param  {string} sTitle Title for the dialog
     * @param  {string} sText  Text for the dialog
     * @return {object}        The busy dialog
     */
    ForecastWizard.prototype._showBusyDialog = function(sTitle, sText) {
      if (!this._oBusyDialog) {
        this._oBusyDialog = sap.ui.xmlfragment("idBusyDialogFragment", "view.BusyDialog", this);
        this.getView().addDependent(this._oBusyDialog);
      }

      // Set title and text
      this._oBusyDialog.setTitle(sTitle);
      this._oBusyDialog.setText(sText);

      // open the busy dialog
      this._oBusyDialog.open();
      return this._oBusyDialog;
    };

    /***
     *    ███████╗████████╗███████╗██████╗      ██╗
     *    ██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ███║
     *    ███████╗   ██║   █████╗  ██████╔╝    ╚██║
     *    ╚════██║   ██║   ██╔══╝  ██╔═══╝      ██║
     *    ███████║   ██║   ███████╗██║          ██║
     *    ╚══════╝   ╚═╝   ╚══════╝╚═╝          ╚═╝
     *
     */

    /**
     * Set up for Step 1. Create a unique forecast ID
     * @return {object} Promise
     */
    ForecastWizard.prototype.setupStep1 = function() {
      var oPromise = jQuery.Deferred();
      if (!this._sForecastId) {
        this._sForecastId = ShortId.generate(10);
      }
      oPromise.resolve();
      return oPromise;
    };

    /**
     * Validates the details of step 1. If it's valid, returns true. If not,
     * show error and returns false.
     * @return {boolean} Valid step details
     */
    ForecastWizard.prototype.validateStep1 = function() {
      // Must have a name...
      var oInput = this.getView().byId("idNewForecastNameInput");
      var sName = oInput.getValue();
      if (sName === "") {
        oInput.setValue("New forecast");
        oInput.setValueState(sap.ui.core.ValueState.Error);
        oInput.setValueStateText("You must name your forecast");
        oInput.setShowValueStateMessage(true);
        return false;
      } else {
        oInput.setShowValueStateMessage(false);
        // supply the name to the new forecast model
        return true;
      }
    };

    /***
     *    ███████╗████████╗███████╗██████╗     ██████╗
     *    ██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ╚════██╗
     *    ███████╗   ██║   █████╗  ██████╔╝     █████╔╝
     *    ╚════██║   ██║   ██╔══╝  ██╔═══╝     ██╔═══╝
     *    ███████║   ██║   ███████╗██║         ███████╗
     *    ╚══════╝   ╚═╝   ╚══════╝╚═╝         ╚══════╝
     *
     */

    /**
     * Set up for Step 2. There is currently nothing to be done, so we are
     * already 'set up'.
     * @return {object} Promise
     */
    ForecastWizard.prototype.setupStep2 = function() {
      var oPromise = jQuery.Deferred();
      oPromise.resolve();
      return oPromise;
    };

    /**
     * When a data set tile is pressed, we set that tile to be selected, by
     * changing it's icon to a tick, and making it green.
     * @param  {object} oEvent Tile press event
     */
    ForecastWizard.prototype.onForecastWizardDataSetTilePress = function(oEvent) {
      var oTile = oEvent.getSource();
      this._sDataSetId = oTile.getBindingContext("dataset").getProperty("id");
      var oTileContainer = oTile.getParent();
      var aTiles = oTileContainer.getTiles();
      var sClass = "ffaForecastWizardTileActive";

      // make sure no other tiles are checked.
      if (aTiles.length !== 0) {
        jQuery.each(aTiles, function(index, tile) {
          if (tile.hasStyleClass(sClass) && tile !== oTile) {
            tile.toggleStyleClass(sClass);
            tile.setIcon(tile.data("icon"));
          }
        });
      }

      // retain the old icon, so we can swap back
      oTile.data("icon", oTile.getIcon());

      // Set our tile to be 'active'
      oTile.setIcon("sap-icon://accept");
      oTile.toggleStyleClass(sClass);

      // simulate skipping to next page
      this.onNextWizardPress(null);
    };

    /**
     * Validates the details of step 2. If it's valid, returns true. If not,
     * show error and returns false.
     * @return {boolean} Valid step details
     */
    ForecastWizard.prototype.validateStep2 = function() {
      // If a dataset has not been selected, remind the user that this
      // must be done...
      var bValid = false;

      // Quick checks; I do these separately, because I can't be sure the global
      // is going to be there, so the first check is actually checking for existence.
      if (!this._sDataSetId) {
        bValid = false;
      } else if (this._sDataSetId === "") {
        bValid = false;
      } else {
        bValid = true;
      }

      // If not valid, show error... or continue
      if (!bValid) {
        this.showInfoAlert(
          "Oops - looks like you forgot to pick a data set!",
          "Select a data set",
          false /* bCompact */
        );
      }

      // And return
      return bValid;
    };

    /***
     *    ███████╗████████╗███████╗██████╗     ██████╗
     *    ██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ╚════██╗
     *    ███████╗   ██║   █████╗  ██████╔╝     █████╔╝
     *    ╚════██║   ██║   ██╔══╝  ██╔═══╝      ╚═══██╗
     *    ███████║   ██║   ███████╗██║         ██████╔╝
     *    ╚══════╝   ╚═╝   ╚══════╝╚═╝         ╚═════╝
     *
     */

    /**
     * Lists the avaiable columns in the data set, excluding Date,
     * allowing the user
     */
    ForecastWizard.prototype.setupStep3 = function() {

      // Eventually, we'll return a promise
      var oPromise = jQuery.Deferred();

      // Bind the page to our DataSet...
      var sPath = "/DataSets('" + this._sDataSetId + "')";
      var oPage = this.getView().byId("idNewForecastWizardPage3");
      oPage.bindElement("dataset>" + sPath, {
        parameters: {
          expand: "Dimensions"
        }
      });

      // Bind the variables table to the data definition, but REMOVE the forecast
      // field(s).
      var oTable = this.getView().byId(sap.ui.core.Fragment.createId("idForecastWizardDateFragment", "idForecastDateTable"));

      // Bind table rows (items); for this initial field seletion for date,
      // the table will automatically try and select the date field. This is done
      // via. a binding on the ColumnListItem's selected property
      oTable.bindItems({
        path: "dataset>Dimensions",
        filters : [new sap.ui.model.Filter({
          path : "type",
          operator : sap.ui.model.FilterOperator.NE,
          value1 : "text"
        })],
        sorter: [new sap.ui.model.Sorter("index", false)],
        template: sap.ui.xmlfragment("view.forecasts.DefinitionRow")
      });

      // for this particular table, we'll also bind to the select event, so we can skip
      // to the next page upon select.
      oTable.attachSelectionChange({}, function(oEvent) {
        var oItem = oEvent.getParameter("listItem");
        if (oItem.getSelected() === true && oItem.getBindingContext("dataset").getProperty("type") === "date") {
          // navigate to next page.
          this.onNextWizardPress(null);
        }
      }, this);

      // Return the resolved promise - this means the page/view is loaded
      oPromise.resolve();
      return oPromise;
    };

    /**
     * In Step 3, the user MUST select a field to forecast. If no such field
     * is selected, the step is invalid.
     * @return {boolean} Valid step details
     */
    ForecastWizard.prototype.validateStep3 = function() {
      // Make sure a field has been selected.
      var oTable = this.getView().byId(sap.ui.core.Fragment.createId("idForecastWizardDateFragment", "idForecastDateTable"));
      var oItem = null;

      // Spin through items, and make sure only one is selected, and that it is of type Date
      jQuery.each(oTable.getSelectedItems() || [], function(index, item) {
        if (item.getBindingContext("dataset").getProperty("type") === "date") {
          oItem = item;
          return;
        }
      });

      // Remove any date batch ops and add this one.
      jQuery.each(this._aBatchOps || [], function(index, op) {
        // How do I read batch ops?
      });

      // If we have an item, then supply the dimension Id to our forecast fields
      // model...
      if (oItem !== null) {

        // Remember this dimension as the date dimension.
        this._oFields.date = oItem.getBindingContext("dataset").getProperty("id");

        // add the new batch operation
        this._aBatchOps.push(this.getView().getModel("forecast").createBatchOperation(
          "/Fields",
          "POST", {
            forecast_id: this._sForecastId,
            dimension_id: this._oFields.date,
            type: "date"
          }));

        return true;
      } else {
        this.showInfoAlert(
          "Yikes! You haven't selected a Date field...",
          "Date field selection",
          false /* bCompact */
        );
        return false;
      }
    };

    /***
     *    ███████╗████████╗███████╗██████╗     ██╗  ██╗
     *    ██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ██║  ██║
     *    ███████╗   ██║   █████╗  ██████╔╝    ███████║
     *    ╚════██║   ██║   ██╔══╝  ██╔═══╝     ╚════██║
     *    ███████║   ██║   ███████╗██║              ██║
     *    ╚══════╝   ╚═╝   ╚══════╝╚═╝              ╚═╝
     *
     */

    /**
     * Lists the avaiable columns in the data set, excluding Date,
     * allowing the user to pick their forecast field.
     */
    ForecastWizard.prototype.setupStep4 = function() {

      // Eventually, we'll return a promise
      var oPromise = jQuery.Deferred();

      // Bind the page to our DataSet...
      var sPath = "/DataSets('" + this._sDataSetId + "')";
      var oPage = this.getView().byId("idNewForecastWizardPage4");
      oPage.bindElement("dataset>" + sPath, {
        parameters: {
          expand: "Dimensions"
        }
      });

      // Bind the variables table to the data definition, but REMOVE the forecast
      // field(s).
      var oTable = this.getView().byId(sap.ui.core.Fragment.createId("idForecastWizardForecastFragment", "idForecastFieldTable"));

      // Bind table rows (items)
      oTable.bindItems({
        path: "dataset>Dimensions",
        sorter: [new sap.ui.model.Sorter("index", false)],
        filters: [new sap.ui.model.Filter({
          path: "id",
          operator: sap.ui.model.FilterOperator.NE,
          value1: this._oFields.date
        }),new sap.ui.model.Filter({
          path : "type",
          operator : sap.ui.model.FilterOperator.NE,
          value1 : "text"
        })],
        template: sap.ui.xmlfragment("view.forecasts.DefinitionRow")
      });

      // for this particular table, we'll also bind to the select event, so we can skip
      // to the next page upon select.
      oTable.attachSelectionChange({}, function(oEvent) {
        var oItem = oEvent.getParameter("listItem");
        if (oItem.getSelected() === true) {
          // navigate to next page.
          this.onNextWizardPress(null);
        }
      }, this);

      // Return the promise
      oPromise.resolve();
      return oPromise;
    };

    /**
     * In Step 4, the user MUST select a field to forecast. If no such field
     * is selected, the step is invalid.
     * @return {boolean} Valid step details
     */
    ForecastWizard.prototype.validateStep4 = function() {
      // Make sure a field has been selected.
      var oTable = this.getView().byId(sap.ui.core.Fragment.createId("idForecastWizardForecastFragment", "idForecastFieldTable"));
      var oItem = null;

      // Remove any forecast batch ops so we can add these new ones.
      jQuery.each(this._aBatchOps || [], function(index, op) {
        // How do I read batch ops?
      });

      // Spin through items, and make sure only one is selected, and that it is of type Date
      var aItems = oTable.getSelectedItems();
      if (aItems.length === 0) {
        this.showInfoAlert(
          "Blistering barnacles, you've not selected your forecast field!",
          "Forecast field selection",
          false /* bCompact */
        );
        return false;
      } else {
        // This is a single select list, so there's only one item to pick
        oItem = aItems[0];
      }

      // Remember this dimension as the date dimension.
      this._oFields.forecast = oItem.getBindingContext("dataset").getProperty("id");

      // add the new batch operation
      this._aBatchOps.push(this.getView().getModel("forecast").createBatchOperation(
        "/Fields",
        "POST", {
          forecast_id: this._sForecastId,
          dimension_id: this._oFields.forecast,
          type: "forecast"
        }));

      return true;
    };

    /***
     *    ███████╗████████╗███████╗██████╗     ███████╗
     *    ██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ██╔════╝
     *    ███████╗   ██║   █████╗  ██████╔╝    ███████╗
     *    ╚════██║   ██║   ██╔══╝  ██╔═══╝     ╚════██║
     *    ███████║   ██║   ███████╗██║         ███████║
     *    ╚══════╝   ╚═╝   ╚══════╝╚═╝         ╚══════╝
     *
     */

    /**
     * Sets up the page for step 5. Now we are selecting - of the remaining fields -
     * which are to be used as variables. Use a Multi select table for this.
     */
    ForecastWizard.prototype.setupStep5 = function() {

      // Eventually, we'll return a promise
      var oPromise = jQuery.Deferred();

      // get the forecast field ID - we need it so as to filter on
      var oFieldTable = this.getView().byId(sap.ui.core.Fragment.createId("idForecastWizardForecastFragment", "idForecastFieldTable"));
      var oItem = oFieldTable.getSelectedItem();
      var sId = oItem.getBindingContext("dataset").getProperty("id");

      // Bind the page to our DataSet...
      var sPath = "/DataSets('" + this._sDataSetId + "')";
      var oPage = this.getView().byId("idNewForecastWizardPage5");
      oPage.bindElement("dataset>" + sPath, {
        parameters: {
          expand: "Dimensions,Cache"
        }
      });

      // Bind the variables table to the data definition, but REMOVE the forecast
      // field(s).
      var oTable = this.getView().byId(sap.ui.core.Fragment.createId("idForecastWizardVariablesFragment", "idForecastVariablesTable"));

      // Bind table rows/items, but remove the date and forecast field
      oTable.bindItems({
        path: "dataset>Dimensions",
        sorter: [new sap.ui.model.Sorter("index", false)],
        filters: [new sap.ui.model.Filter({
          filters: [new sap.ui.model.Filter({
            path: "id",
            operator: sap.ui.model.FilterOperator.NE,
            value1: this._oFields.date,
            and: true
          }), new sap.ui.model.Filter({
            path: "id",
            operator: sap.ui.model.FilterOperator.NE,
            value1: this._oFields.forecast
          }),new sap.ui.model.Filter({
            path : "type",
            operator : sap.ui.model.FilterOperator.NE,
            value1 : "text"
          })],
          and: true
        })],
        template: sap.ui.xmlfragment("view.forecasts.DefinitionRow")
      });

      // Return the promise
      oPromise.resolve();
      return oPromise;
    };

    /**
     * Validates the details of step 5. We simply need to check if the user
     * has selected any fields for variables. They don't have to of course, but
     * maybe we need to suggest they do so?
     * Additionally, we also need to check that the fields selected are of type
     * Number (we can't use strings to forecast on).
     * @return {boolean} Valid step details
     */
    ForecastWizard.prototype.validateStep5 = function() {
      // get the selected table items
      // for each, check the context binding and get the id.
      // if the type is Date, then we need to exclude this from the selection
      // by unchecking the box.
      var oTable = this.getView().byId(sap.ui.core.Fragment.createId("idForecastWizardVariablesFragment", "idForecastVariablesTable"));

      // reset variables container
      this._oFields.variables = [];

      // Remove any variable batch ops so we can add these new ones.
      jQuery.each(this._aBatchOps || [], function(index, op) {
        // How do I read batch ops?
      });

      // For each of the items, find the selected rows.
      jQuery.each(oTable.getSelectedItems() || [], jQuery.proxy(function(index, item) {
        // Local variables only here
        let oContext = item.getBindingContext("dataset");
        let sId = oContext.getProperty("id") || "";
        if (oContext.getProperty("type").toLowerCase() === "date") {

          // Fields of type date cannot be variables
          item.setSelected(false);
        } else {

          // Declare the dimension Id
          let sId = oContext.getProperty("id");

          // add the field ID to our list of variables
          this._oFields.variables.push(sId);

          // add the new batch operation
          this._aBatchOps.push(this.getView().getModel("forecast").createBatchOperation(
            "/Fields",
            "POST", {
              forecast_id: this._sForecastId,
              dimension_id: sId,
              type: "variable"
            }));
        }
      }, this));

      // return true
      return true;
    };

    /***
     *    ███████╗████████╗███████╗██████╗      ██████╗
     *    ██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ██╔════╝
     *    ███████╗   ██║   █████╗  ██████╔╝    ███████╗
     *    ╚════██║   ██║   ██╔══╝  ██╔═══╝     ██╔═══██╗
     *    ███████║   ██║   ███████╗██║         ╚██████╔╝
     *    ╚══════╝   ╚═╝   ╚══════╝╚═╝          ╚═════╝
     *
     */

    /**
     * The user has now told us which fields are for forecasting, and which are
     * for variables. In Step 6, we want to determine the effective date (which is
     * limited by the endda in the Cache Header), the horizon days, the years of
     * training data (the minimum for which is determined by the horizon), and a
     * validation period, if required (defaults to the same as the horizon).
     */
    ForecastWizard.prototype.setupStep6 = function() {

      // Eventually, we'll return a promise
      var oPromise = jQuery.Deferred();
      var sId = this._sDataSetId;
      var sPath = "/CacheHeader('" + sId + "')";

      // if there were any problems, alert - There are no problems here...
      // Show the busy dialog...
      var oBusyDialog = this._showBusyDialog("Caching data", "One moment please - pre-caching data set");

      // Now we have our forecast field and variables, it's time to cache the Data
      // call model.update('DataSet(id)/Cache')
      var oModel = this.getView().getModel("dataset");

      // a date is provided to this update method, to time stamp the cache
      // depending on the width of the data set, it could be stored in one of three
      // odata end-points - small, med, large
      var oCacheHeader = {
        dataset_id: sId,
        date: new Date(Date.now()).toISOString(),
        user: "TESTUSER",
        begda: new Date(0), // not required
        endda: new Date(0), // not required
        columns: 0, // not required
        bytes: 0 // not required
      };

      // Do the create
      var that = this;
      oModel.update(sPath, oCacheHeader, {
        success: function(oData, mResponse) {
          // Bind the Page to the Cache Header
          let oPage = that.getView().byId("idNewForecastWizardPage6");
          oPage.bindElement("dataset>" + sPath);

          // Close dialog and resolve promise
          oBusyDialog.close();
          oPromise.resolve();
        },
        error: function(mError) {
          // It is probably important to do a lot of error handling here
          oBusyDialog.close();
          oPromise.resolve();
        },
        merge: true,
        async: true
      });

      // Return our promise - it will not be resolved until data is loaded
      // and the page is bound.
      return oPromise;
    };

    /**
     * When the effective date is changed, we perform some quick checks to make
     * sure the effective date is valid. That is, it cannot be greater than the
     * dataset's end date, or earlier than the data set's begin date.
     * @param  {object} oEvent Selection change event
     */
    ForecastWizard.prototype.onForecastEffectiveDateChange = function(oEvent) {

    };

    /**
     * Okay, we have everything we need for a forecast. Let's check the horizon, effective
     * date, validation and training periods all check out.
     * Submit the batch jobs, to create the forecast and variables, then run it.
     * @return {boolean} Valid step details
     */
    ForecastWizard.prototype.validateStep6 = function() {

      // We need to collect all the relevant dets for a new forecast.
      var oForecast = this._buildForecast();
      // TODO validation

      // Remove any forecasts from batch operations.
      jQuery.each(this._aBatchOps || [], function(index, op) {
        // How do I read batch ops?
      });

      // add the forecast into our batch operations too!
      var oModel = this.getView().getModel("forecast");
      this._aBatchOps.push(oModel.createBatchOperation(
        "/Forecasts",
        "POST",
        oForecast
      ));

      return true;
    };

    /**
     * Builds a forecast object wrapper using values pulled from the
     * form fields, and from global variables.
     * @return {object} Forecast object
     */
    ForecastWizard.prototype._buildForecast = function() {
      // Collect the values from all of our inputs.
      return {
        id: this._sForecastId,
        dataset_id: this._sDataSetId,
        folder_id: this._sFolderId,
        name: this.getView().byId("idNewForecastNameInput").getValue(),
        user: "TESTUSER",
        created: new Date(Date.now()),
        begda: this._date(new Date(Date.now())),
        endda: this._utc(new Date("9999-12-31T23:59:59")),
        train_to: this._date(new Date(this.getView().byId("idNewForecastToDatePicker").getValue())),
        train_from: this._date(new Date(this.getView().byId("idNewForecastFromDatePicker").getValue())),
        horizon: parseInt(this.getView().byId("idNewForecastHorizonInput").getValue(), 10),
        validation: parseInt(this.getView().byId("idNewForecastValidationInput").getValue(), 10),
        smoothing: (this.getView().byId("idNewForecastSmoothingCheckBox").getSelected() ? "X" : " "),
        running: " "
      };
    };

    /***
     *    ███████╗████████╗███████╗██████╗     ███████╗
     *    ██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ╚════██║
     *    ███████╗   ██║   █████╗  ██████╔╝        ██╔╝
     *    ╚════██║   ██║   ██╔══╝  ██╔═══╝        ██╔╝
     *    ███████║   ██║   ███████╗██║            ██║
     *    ╚══════╝   ╚═╝   ╚══════╝╚═╝            ╚═╝
     *
     */

    /**
     * The forecast is now running. Would they like a notficiation when it's done?
     */
    ForecastWizard.prototype.setupStep7 = function() {

      // Indicate the forecast is commencing.
      var oBusyDialog = this._showBusyDialog("Forecasting", "Firing up old Betsy - one moment...");
      var oCreatedPromise = jQuery.Deferred();
      var oRunPromise = jQuery.Deferred();
      var oModel = this.getView().getModel("forecast");
      var oRun = {
        id: "",
        forecast_id: this._sForecastId,
        //run_at: new Date(Date.now()),
        user: "TESTUSER"
      };

      // Load up the batch changes, and submit.
      oModel.addBatchChangeOperations(this._aBatchOps);
      oModel.submitBatch(jQuery.proxy(function(oData, oResponse, aErrorResponses) {
          // we can resolve the creation promise
          oCreatedPromise.resolve();
        }, this), jQuery.proxy(function(oError) {
          // we can resolve the creation promise
          oCreatedPromise.resolve();
        }, this),
        /* bAsync= */
        true,
        /* bImportData= */
        true
      );

      // When we know the forecast has been created, we can run it...
      jQuery.when(oCreatedPromise).then(function() {
        oModel.create("/Runs", oRun, {
          success: function(oData, mResponse) {
            oRunPromise.resolve();
            oBusyDialog.close();
          },
          error: function(mError) {
            oRunPromise.resolve();
            oBusyDialog.close();
          },
          async: true
        });
        oBusyDialog.close();
      });

      // return our submitted promise
      return oRunPromise;
    };

    /**
     * Validates the details of step 7 - this is just collecting a user's
     * notification request
     * @return {boolean} Valid step details
     */
    ForecastWizard.prototype.validateStep7 = function() {
      return true;
    };



    ForecastWizard.prototype._createFields = function() {
      return true;
    };

    ForecastWizard.prototype._runForecast = function() {
      return true;
    };

    return ForecastWizard;

  }, /* bExport= */ true);
