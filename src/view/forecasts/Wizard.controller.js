jQuery.sap.declare("com.ffa.hpc.view.forecasts.Wizard");
jQuery.sap.require("com.ffa.hpc.thirdparty.shortid.ShortId");
jQuery.sap.require("com.ffa.hpc.util.DateFormatter");
jQuery.sap.require("com.ffa.hpc.thirdparty.momentjs.Momentjs");

sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/view/forecasts/DatasetAuth'],
  function(jQuery, Controller) {
    "use strict";

    var Wizard = Controller.extend("com.ffa.hpc.view.forecasts.Wizard", /** @lends com.ffa.hpc.view.forecasts.Wizard.prototype */ {
      _isAllowedCheckTime: moment(),
      _isAllowed: false
    });

    /**
     * On init handler
     */
    Wizard.prototype.onInit = function() {
      // Our folder Id globals
      this._sFolderId = "";
      this._aBatchOps = [];
      this._oFields = {
        forecast: "",
        variables: []
      };

      // subscribe to the Forecast finished event
      this.getEventBus().subscribe("Forecast", "Finished", this._onForecastingFinished, this);

      // handle route matched
      this.getRouter().getRoute("new-forecast-from-folder").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Wizard.prototype.onExit = function() {};

    /**
     * Before rendering, set up required icons
     */
    Wizard.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Wizard.prototype.onAfterRendering = function() {};

    /***
     *    ███╗   ██╗ █████╗ ██╗   ██╗
     *    ████╗  ██║██╔══██╗██║   ██║
     *    ██╔██╗ ██║███████║██║   ██║
     *    ██║╚██╗██║██╔══██║╚██╗ ██╔╝
     *    ██║ ╚████║██║  ██║ ╚████╔╝
     *    ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝
     *
     */

    /**
     * Route matched handler
     * @param  {object} oEvent Route matched event
     */
    Wizard.prototype._onRouteMatched = function(oEvent) {
      this._checkMetaDataLoaded("forecast");
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

      // First we're going to check if this user has enough data allowance to
      // create a new data set...
      var oPromise = jQuery.Deferred();
      var self = this;

      // When the promise is resolved, we set up as per usual. If the Promise
      // is rejected, then show the message page
      jQuery.when(oPromise)
        .fail(function() { // rejected - go to sad face
          oNav.to(self.getView().byId("idOverLimitMessagePage"));
        })
        .done(function() { // resolved - go to new data set page
          // and run setup for step one.
          self.setupNamePage();

          // Let the master list know I'm on this Folders view.
          self.getEventBus().publish("Folders", "RouteMatched", {} /* payload */ );
        });

      // Now check if the user is allowed to make another forecast
      this._isAllowedNew(oPromise);
    };

    /**
     * Navigate within the NavContainer backwards (no routing occurs here)
     * @param  {object} oEvent Button press event
     */
    Wizard.prototype.onBackPress = function(oEvent) {

      var oNav = this._getNavContainer(),
        oCurrentPage = oNav.getCurrentPage();

      // Collect this page's destiantions in custom data.
      var sPrevId = oCurrentPage.data("prev"),
        sNextId = oCurrentPage.data("next");

      // The previous page has no prev page, then disable the back button
      var oPrevPage = this.getView().byId(sPrevId);
      if (oPrevPage.data("prev")) {
        this.getView().byId("idBackButton").setEnabled(false);
      }

      // And next button
      var oNextButton = this.getView().byId("idNextButton");
      if (sNextId) {
        oNextButton.setEnabled(true);
      } else {
        oNextButton.setEnabled(false);
      }

      // set page Title
      this._setPageTitle(oPrevPage.getTitle());

      // Nav back
      oNav.back();
    };

    /**
     * When the Wizard Cancel button is pressed, we navigate back to either the
     * parent folder, or our Forecast listing.
     * @param  {object} oEvent Button press event
     */
    Wizard.prototype.onCancelPress = function(oEvent) {
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

      // Reset all pages...
      this._reset();
    };

    /**
     * When the Wizard Next button is pressed, we perform validation checks
     * then navigate to the next page
     * @param  {object} oEvent Button press event
     */
    Wizard.prototype.onNextPress = function(oEvent) {

      var oNav = this._getNavContainer(),
        oCurrentPage = oNav.getCurrentPage();

      // Collect this page's destiantions in custom data.
      var sPrevId = oCurrentPage.data("prev"),
        sNextId = oCurrentPage.data("next"),
        fnValidate = oCurrentPage.data("validate");

      var oNextPage = this.getView().byId(sNextId),
        fnSetup = oNextPage.data("setup");

      // Validate the details in the step.
      // If all checks are passed, then go to the next view.
      if (typeof this[fnValidate] !== "function") {
        // If there's no validation function for this step, then go forwards.
        oNav.to(this.getView().byId(sNextId));
        return;
      }

      // Otherwise, we're going to call the validation step.
      this[fnValidate].apply(this, [
        jQuery.proxy(function() {

          // set page Title
          this._setPageTitle(oNextPage.getTitle());

          // set back button activation
          var oBackButton = this.getView().byId("idBackButton");
          if (sPrevId) {
            oBackButton.setEnabled(true);
          } else {
            oBackButton.setEnabled(false);
          }

          // And next button
          var oNextButton = this.getView().byId("idNextButton");
          if (sNextId) {
            oNextButton.setEnabled(true);
          } else {
            oNextButton.setEnabled(false);
          }

          // Perform optional page set up.
          try {
            var oPromise = this[fnSetup].apply(this, []);
            // when the promise is resolved, we can navigate.
            jQuery.when(oPromise).then(jQuery.proxy(function() {
              // Navigate to the next view
              oNav.to(this.getView().byId(sNextId));
            }, this));
          } catch (e) {
            // No setup step. Navigate immediately
            oNav.to(this.getView().byId(sNextId));
          }
        }, this), // Success callback
        jQuery.proxy(function() {

        }, this) // Error callback
      ]);
    };

    /**
     * Navigate to the newly created forecast.
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Wizard.prototype.onDoneLinkPress = function(oEvent) {
      this.getRouter().navTo("forecast-from-folder", {
        folder_id: this._sFolderId,
        forecast_id: this._sForecastId
      }, !sap.ui.Device.system.phone);

      // Raise an event to signal the end of all forecast processing.
      // The user must now go home, or go to the forecast.
      this.getEventBus().publish("Forecast", "Finished", {
        forecast_id: this._sForecastId
      });

      // If we've recorded username and password during this process, now
      // is a good time to get rid of them...
      this.getEventBus().publish("Wizard", "ClearAuth", {
        dataset_id: this._sDataSetId
      });

    };

    /**
     * Go home!
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Wizard.prototype.onHomePress = function(oEvent) {
      this.getRouter().navTo("workbench", {}, !sap.ui.Device.system.phone);

      // Raise an event to signal the end of all forecast processing.
      // The user must now go home, or go to the forecast.
      this.getEventBus().publish("Forecast", "Finished", {
        forecast_id: this._sForecastId
      });
    };

    /**
     * Navigate within the NavContainer backwards (no routing occurs here)
     * @return  {Control}    Nav container control
     */
    Wizard.prototype._getNavContainer = function(oEvent) {

      return this.getView().byId("idNavContainer");
    };

    /***
     *    ██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗ ███████╗
     *    ██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
     *    ███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝███████╗
     *    ██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║
     *    ██║  ██║███████╗███████╗██║     ███████╗██║  ██║███████║
     *    ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝
     *
     */

    /**
     * Sets the main wizard page title
     * @param  {[type]} sTitle [description]
     */
    Wizard.prototype._setPageTitle = function(sTitle) {
      this.getView().byId("idWizardTitle").setText(sTitle);
    };

    /**
     * Reset all pages in the screen.
     * @return {[type]} [description]
     */
    Wizard.prototype._reset = function() {

      // Page 1
      var oInput = this.getView().byId("idNewForecastNameInput");
      oInput.setValue("");
      oInput.setValueState(sap.ui.core.ValueState.None);
      oInput.setValueStateText("");

      // Page 2
      var oTileContainer = this.getView().byId("idDatasetsTileContainer");
      var aTiles = oTileContainer.getTiles();
      var sClass = "ffaForecastWizardTileActive";

      // make sure no other tiles are checked.
      if (aTiles.length !== 0) {
        jQuery.each(aTiles, function(index, tile) {
          if (tile.hasStyleClass(sClass)) {
            tile.toggleStyleClass(sClass);
            tile.setIcon(tile.data("icon"));
          }
        });
      }

      // If we've recorded username and password during this process, now
      // is a good time to get rid of them...
      this.getEventBus().publish("Wizard", "ClearAuth", {
        dataset_id: this._sDataSetId
      });

      // Page 3
      var oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idDateFieldsFragment", "idDateFieldTable")
      );
      var aItems = oTable.getItems();
      if (aItems.length !== 0) {
        jQuery.each(aItems, function(index, item) {
          if (item.getSelected()) {
            item.setSelected(false);
            return;
          }
        });
      }

      // Page 3
      var oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idForecastFieldsFragment", "idForecastFieldTable")
      );
      var aItems = oTable.getItems();
      if (aItems.length !== 0) {
        jQuery.each(aItems, function(index, item) {
          if (item.getSelected()) {
            item.setSelected(false);
            return;
          }
        });
      }

      // Page 4
      oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idVariableFieldsFragment", "idForecastVariablesTable")
      );
      aItems = oTable.getItems();
      if (aItems.length !== 0) {
        jQuery.each(aItems, function(index, item) {
          if (item.getSelected()) {
            item.setSelected(false);
          }
        });
      }

      // Page 5
      this.getView().byId("idToDatePicker").setValue("");
      this.getView().byId("idHorizonInput").setValue("");
      this.getView().byId("idFromDatePicker").setValue("");
      this.getView().byId("idValidationInput").setValue("");

      // Delete the cache, if one was created.
      if (this._sCacheId) {
        if (this._oCacheHandle) {
          this._oCacheHandle.abort();
        }
        this.getView().getModel("forecast").remove("/Cache('" + this._sCacheId + "')", {
          async: true
        });
      }

      // And unset the global vars.
      this._sFolderId = "";
      this._sForecastId = "";
      this._sDataSetId = "";
      this._sCacheId = "";
      this._aBatchOps = [];
      this._oFields = {
        date: "",
        forecast: "",
        variables: []
      };

      // We also need to send the wizard back to page 1
      this._getNavContainer().backToTop();
    };

    /**
     * When forecasting is completed, we lock up the screen. User may now only
     * go home, or go to Forecast.
     * @param  {[type]} sChannel [description]
     * @param  {[type]} sEvent   [description]
     * @param  {[type]} oData    [description]
     */
    Wizard.prototype._onForecastingFinished = function(sChannel, sEvent, oData) {

      // Cancel button
      this.getView().byId("idCancelButton").setEnabled(false);
      this.getView().byId("idCancelButton").setVisible(false);

      // Home button
      this.getView().byId("idHomeButton").setEnabled(true);
      this.getView().byId("idHomeButton").setVisible(true);

      // Page title
      this.getView().byId("idWizardTitle").setText("Done");

      // Back button
      this.getView().byId("idBackButton").setEnabled(false);
      this.getView().byId("idBackButton").setVisible(false);

      // Next button
      this.getView().byId("idNextButton").setEnabled(false);
      this.getView().byId("idNextButton").setVisible(false);

      // Nav back to start page...
      this._getNavContainer().backToTop();
    };

    /***
     *     ██████╗ █████╗  ██████╗██╗  ██╗███████╗
     *    ██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝
     *    ██║     ███████║██║     ███████║█████╗
     *    ██║     ██╔══██║██║     ██╔══██║██╔══╝
     *    ╚██████╗██║  ██║╚██████╗██║  ██║███████╗
     *     ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝
     *
     */

    /**
     * Refresh the cache
     * @return {[type]} [description]
     */
    Wizard.prototype._startCacheRefresh = function() {
      this._oCachePromise = jQuery.Deferred();

      // If we've already tried to create, abort, so we can do it again.
      if (this._oCacheHandle) {
        this._oCacheHandle.abort();
        this._oCacheHandle = undefined;
      }

      // Do the read
      this._oCacheHandle = this.getView().getModel("forecast").create("/Cache", this._getCacheData(), {
        success: jQuery.proxy(function(oData, mResponse) {
          // If we successfully read the cache, then we'll resolve this promise
          // so user doesn't have to wait for a refresh later.
          this._oCachePromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {

        }, this),
        async: true
      });
    };

    /**
     * Compile all necessary attributes to create cache. Note, these are mostly
     * dummy attributes.
     * @return {object} Cache object
     */
    Wizard.prototype._getCacheData = function() {

      // Do we need a new cache id?
      if (!this._sCacheId) {
        this._sCacheId = ShortId.generate(10);
      }

      return {
        id: this._sCacheId,
        forecast_id: this._sForecastId,
        dataset_id: this._sDataSetId,
        created_at: new Date(Date.now()),
        user: this.getProfileId(),
        columns: 0, // not required
        bytes: 0, // not required
        begda: new Date(0), // not required
        endda: new Date(0) // not required
      };
    };

    /***
     *    ███╗   ██╗ █████╗ ███╗   ███╗███████╗
     *    ████╗  ██║██╔══██╗████╗ ████║██╔════╝
     *    ██╔██╗ ██║███████║██╔████╔██║█████╗
     *    ██║╚██╗██║██╔══██║██║╚██╔╝██║██╔══╝
     *    ██║ ╚████║██║  ██║██║ ╚═╝ ██║███████╗
     *    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
     *
     */

    /**
     * Set up for Step 1. Create a unique forecast ID
     * @return {object} Promise
     */
    Wizard.prototype.setupNamePage = function() {
      var oPromise = jQuery.Deferred();
      if (!this._sForecastId) {
        this._sForecastId = ShortId.generate(10);
      }

      // return
      oPromise.resolve();
      return oPromise;
    };

    /**
     * Validates the details of step 1. If it's valid, returns true. If not,
     * show error and returns false.
     * @param  {Function} done  Done callback
     * @param  {Function} error Error callback
     */
    Wizard.prototype.validateNamePage = function(done, error) {
      // Must have a name...
      var oInput = this.getView().byId("idNewForecastNameInput");
      var sName = oInput.getValue();
      if (sName === "") {
        oInput.setValue("My new forecast")
          .setValueState(sap.ui.core.ValueState.Error)
          .setValueStateText("You must name your forecast")
          .setShowValueStateMessage(true);
        error();
      } else {
        oInput.setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("")
          .setShowValueStateMessage(false);
        // supply the name to the new forecast model
        done();
      }
    };

    /***
     *    ██████╗  █████╗ ████████╗ █████╗ ███████╗███████╗████████╗███████╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔════╝
     *    ██║  ██║███████║   ██║   ███████║███████╗█████╗     ██║   ███████╗
     *    ██║  ██║██╔══██║   ██║   ██╔══██║╚════██║██╔══╝     ██║   ╚════██║
     *    ██████╔╝██║  ██║   ██║   ██║  ██║███████║███████╗   ██║   ███████║
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Set up for Step 2. There is currently nothing to be done, so we are
     * already 'set up'.
     * @return {object} Promise
     */
    Wizard.prototype.setupDatasetPage = function() {
      var oPromise = jQuery.Deferred();
      oPromise.resolve();
      return oPromise;
    };

    /**
     * When a data set tile is pressed, we set that tile to be selected, by
     * changing it's icon to a tick, and making it green.
     * @param  {object} oEvent Tile press event
     */
    Wizard.prototype.onDataSetTilePress = function(oEvent) {
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

      // simulate skipping to next page and a validation of the page.
      this.onNextPress(null);
    };

    /**
     * Validates the details of step 2. If it's valid, returns true. If not,
     * show error and returns false.
     * @param  {Function} done  Done callback
     * @param  {Function} error Error callback
     */
    Wizard.prototype.validateDatasetPage = function(done, error) {

      // If not valid, show error... or continue
      if (!this._sDataSetId) {
        // Show error
        this.showInfoAlert(
          "Oops - looks like you forgot to pick a data set!",
          "Select a data set",
          false /* bCompact */
        );
        return error();
      }

      // We're now busy, as we have some things to check!
      this.showBusyDialog({});

      // If this data set requires authentication, then we will prompt the user
      // for their login details now...
      var oPromise = jQuery.Deferred();

      // Maybe prompt the user for authentication
      // NOTE: this function lives down in the DatasetAuth Controller
      this._maybeAuthenticateDataset(this._sDataSetId, oPromise);

      jQuery.when(oPromise)
        // if the promise is resolved, then we can advance
        .done(jQuery.proxy(function() {
          // begin cache refresh
          this._startCacheRefresh();

          // Not busy
          this.hideBusyDialog();

          // Done
          done();
        }, this))
        // if not, then do not go anywhere...
        .fail(jQuery.proxy(function() {

          // Not busy
          this.hideBusyDialog();

          // we don't go anywhere
          error();
        }, this));
    };

    /***
     *    ██████╗  █████╗ ████████╗███████╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
     *    ██║  ██║███████║   ██║   █████╗
     *    ██║  ██║██╔══██║   ██║   ██╔══╝
     *    ██████╔╝██║  ██║   ██║   ███████╗
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Lists the avaiable columns in the data set,
     * allowing the user to pick their forecast field.
     */
    Wizard.prototype.setupDatePage = function() {

      // Eventually, we'll return a promise
      var oPromise = jQuery.Deferred();

      // Bind the page to our DataSet...
      var sPath = "/DataSets('" + this._sDataSetId + "')";
      var oPage = this.getView().byId("idDatePage");
      oPage.bindElement("dataset>" + sPath, {
        parameters: {
          expand: "Dimensions"
        }
      });

      // Bind the variables table to the data definition, but REMOVE the forecast
      // field(s).
      var oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idDateFieldsFragment", "idDateFieldTable")
      );

      // Bind table rows (items)
      oTable.bindItems({
        path: "dataset>Dimensions",
        sorter: [new sap.ui.model.Sorter("index", false)],
        template: sap.ui.xmlfragment("com.ffa.hpc.view.forecasts.DateField")
      });

      // for this particular table, we'll also bind to the select event, so we can skip
      // to the next page upon select.
      oTable.attachSelectionChange({}, function(oEvent) {
        var oItem = oEvent.getParameter("listItem");
        if (oItem.getSelected() === true) {
          // navigate to next page.
          this.onNextPress(null);
        }
      }, this);

      // Return the promise
      oPromise.resolve();
      return oPromise;
    };

    /**
     * The user must select a single date field to use, and it must be of type
     * Date.
     * @param  {Function} done  Done callback
     * @param  {Function} error Error callback
     */
    Wizard.prototype.validateDatePage = function(done, error) {
      // // Make sure a field has been selected.
      // var oTable = this.getView().byId(sap.ui.core.Fragment.createId("idDateFieldsFragment", "idDateFieldTable"));
      // var oItem = null;
      //
      // // Spin through items, and make sure only one is selected, and that it is of type Date
      // var aItems = oTable.getSelectedItems();
      // if (aItems.length === 0) {
      //   this.showInfoAlert(
      //     "Eeep! No Date field was selected. We really, really need this...",
      //     "Date field selection",
      //     false /* bCompact */
      //   );
      //   return error();
      // } else {
      //   // This is a single select list, so there's only one item to pick
      //   oItem = aItems[0];
      // }
      //
      // // if this is not type date, we have a problem...
      // var oContext = oItem.getBindingContext("dataset");
      // if (oContext.getProperty("type").toLowerCase() !== "date") {
      //   this.showInfoAlert(
      //     "Erm, that's not a Date field. Please only select Date fields...",
      //     "Date field selection",
      //     false /* bCompact */
      //   );
      //   return error();
      // }
      //
      // // Remember this dimension as the date dimension.
      // this._oFields.date = oContext.getProperty("id");
      done();
    };

    /***
     *    ███████╗ ██████╗ ██████╗ ███████╗ ██████╗ █████╗ ███████╗████████╗
     *    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██╔════╝╚══██╔══╝
     *    █████╗  ██║   ██║██████╔╝█████╗  ██║     ███████║███████╗   ██║
     *    ██╔══╝  ██║   ██║██╔══██╗██╔══╝  ██║     ██╔══██║╚════██║   ██║
     *    ██║     ╚██████╔╝██║  ██║███████╗╚██████╗██║  ██║███████║   ██║
     *    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝
     *
     */

    /**
     * Lists the avaiable columns in the data set, excluding Date,
     * allowing the user to pick their forecast field.
     */
    Wizard.prototype.setupForecastPage = function() {

      // Eventually, we'll return a promise
      var oPromise = jQuery.Deferred();

      // Bind the page to our DataSet...
      var sPath = "/DataSets('" + this._sDataSetId + "')";
      var oPage = this.getView().byId("idForecastPage");
      oPage.bindElement("dataset>" + sPath, {
        parameters: {
          expand: "Dimensions"
        }
      });

      // Bind the variables table to the data definition, but REMOVE the forecast
      // field(s).
      var oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idForecastFieldsFragment", "idForecastFieldTable")
      );

      // Bind table rows (items)
      oTable.bindItems({
        path: "dataset>Dimensions",
        sorter: [new sap.ui.model.Sorter("index", false)],
        filters: [new sap.ui.model.Filter({
          filters: [new sap.ui.model.Filter({
            path: "type",
            operator: sap.ui.model.FilterOperator.NE,
            value1: "text"
          }), new sap.ui.model.Filter({
            path: "type",
            operator: sap.ui.model.FilterOperator.NE,
            value1: "date"
          })],
          and: true
        })],
        template: sap.ui.xmlfragment("com.ffa.hpc.view.forecasts.ForecastField")
      });

      // for this particular table, we'll also bind to the select event, so we can skip
      // to the next page upon select.
      oTable.attachSelectionChange({}, function(oEvent) {
        var oItem = oEvent.getParameter("listItem");
        if (oItem.getSelected() === true) {
          // navigate to next page.
          this.onNextPress(null);
        }
      }, this);

      // Return the promise
      oPromise.resolve();
      return oPromise;
    };

    /**
     * In Step 4, the user MUST select a field to forecast. If no such field
     * is selected, the step is invalid.
     * @param  {Function} done  Done callback
     * @param  {Function} error Error callback
     */
    Wizard.prototype.validateForecastPage = function(done, error) {
      // Make sure a field has been selected.
      var oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idForecastFieldsFragment", "idForecastFieldTable")
      );
      var oItem = null;

      // Spin through items, and make sure only one is selected, and that it is of type Date
      var aItems = oTable.getSelectedItems();
      if (aItems.length === 0) {
        this.showInfoAlert(
          "Blistering barnacles, you've not selected your forecast field!",
          "Forecast field selection",
          false /* bCompact */
        );
        return error();
      } else {
        // This is a single select list, so there's only one item to pick
        oItem = aItems[0];
      }

      // if this is not type date, we have a problem...
      var oContext = oItem.getBindingContext("dataset");
      var sType = oContext.getProperty("type").toLowerCase();
      if (!(sType !== "number" || sType !== "decimal")) {
        var sInflectedType = sType.charAt(0).toUpperCase() + sType.slice(1);
        this.showInfoAlert(
          "Oops! Unfortunately you can't forecast " + sInflectedType + " fields. Please only select Number/Decimal type fields",
          "Forecast field selection",
          false /* bCompact */
        );
        return error();
      }

      // Remember this dimension as the date dimension.
      this._oFields.forecast = oContext.getProperty("id");
      done();
    };

    /***
     *    ██╗   ██╗ █████╗ ██████╗ ██╗ █████╗ ██████╗ ██╗     ███████╗███████╗
     *    ██║   ██║██╔══██╗██╔══██╗██║██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝
     *    ██║   ██║███████║██████╔╝██║███████║██████╔╝██║     █████╗  ███████╗
     *    ╚██╗ ██╔╝██╔══██║██╔══██╗██║██╔══██║██╔══██╗██║     ██╔══╝  ╚════██║
     *     ╚████╔╝ ██║  ██║██║  ██║██║██║  ██║██████╔╝███████╗███████╗███████║
     *      ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚══════╝
     *
     */

    /**
     * Sets up the page for step 4. Now we are selecting - of the remaining fields -
     * which are to be used as variables. Use a Multi select table for this.
     */
    Wizard.prototype.setupVariablesPage = function() {

      // Eventually, we'll return a promise
      var oPromise = jQuery.Deferred();

      // Bind the page to our DataSet...
      var sPath = "/DataSets('" + this._sDataSetId + "')";
      var oPage = this.getView().byId("idVariablesPage");
      oPage.bindElement("dataset>" + sPath, {
        parameters: {
          expand: "Dimensions,Cache"
        }
      });

      // Bind the variables table to the data definition, but REMOVE the forecast
      // field(s).
      var oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idVariableFieldsFragment", "idForecastVariablesTable")
      );

      // Bind table rows/items, but remove the date and forecast field
      oTable.bindItems({
        path: "dataset>Dimensions",
        sorter: [new sap.ui.model.Sorter("index", false)],
        filters: [new sap.ui.model.Filter({
          filters: [new sap.ui.model.Filter({
            path: "id",
            operator: sap.ui.model.FilterOperator.NE,
            value1: this._oFields.forecast
          }), new sap.ui.model.Filter({
            path: "type",
            operator: sap.ui.model.FilterOperator.NE,
            value1: "text"
          }), new sap.ui.model.Filter({
            path: "type",
            operator: sap.ui.model.FilterOperator.NE,
            value1: "date"
          })],
          and: true
        })],
        template: sap.ui.xmlfragment("com.ffa.hpc.view.forecasts.VariableField")
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
     * @param  {Function} done  Done callback
     * @param  {Function} error Error callback
     */
    Wizard.prototype.validateVariablesPage = function(done, error) {
      // get the selected table items
      // for each, check the context binding and get the id.
      // if the type is Date, then we need to exclude this from the selection
      // by unchecking the box.
      var oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idVariableFieldsFragment", "idForecastVariablesTable")
      );

      // reset variables container
      this._oFields.variables = [];

      // For each of the items, find the selected rows.
      jQuery.each(oTable.getSelectedItems() || [], jQuery.proxy(function(index, item) {
        // Local variables only here
        var oContext = item.getBindingContext("dataset");
        var sId = oContext.getProperty("id") || "";
        if (oContext.getProperty("type").toLowerCase() === "date") {

          // Fields of type date cannot be variables
          item.setSelected(false);
        } else {

          // Declare the dimension Id
          var sId = oContext.getProperty("id");

          // add the field ID to our list of variables
          this._oFields.variables.push(sId);
        }
      }, this));

      done();
    };

    /***
     *    ██████╗  █████╗ ██████╗  █████╗ ███╗   ███╗███████╗
     *    ██╔══██╗██╔══██╗██╔══██╗██╔══██╗████╗ ████║██╔════╝
     *    ██████╔╝███████║██████╔╝███████║██╔████╔██║███████╗
     *    ██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║╚██╔╝██║╚════██║
     *    ██║     ██║  ██║██║  ██║██║  ██║██║ ╚═╝ ██║███████║
     *    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
     *
     */

    /**
     * The user has now told us which fields are for forecasting, and which are
     * for variables. In Step 6, we want to determine the effective date (which is
     * limited by the endda in the Cache Header), the horizon days, the years of
     * training data (the minimum for which is determined by the horizon), and a
     * validation period, if required (defaults to the same as the horizon).
     */
    Wizard.prototype.setupParamsPage = function() {

      // Eventually, we'll return a promise
      var oPromise = jQuery.Deferred();
      var sPath = "/Cache('" + this._sCacheId + "')";

      // if there were any problems, alert - There are no problems here...
      // Show the busy dialog...
      if (this._oCachePromise.state() !== "resolved") {
        this.openBusyDialog({
          title: "Caching data",
          text: "One moment please - pre-caching data set",
          showCancelButton: false
        });
      }

      // Now we wait for the cache promise
      jQuery.when(this._oCachePromise).then(jQuery.proxy(function() {

        // Bind the Page to the Cache Header
        var oPage = this.getView().byId("idParamsPage");
        oPage.bindElement("forecast>" + sPath);

        var oToDatePicker = this.getView().byId("idToDatePicker");
        if (!oToDatePicker.getDateValue()) {
          // set the effective date onload
          oToDatePicker.setDateValue(this._getMaxDate(this._sCacheId));
        }

        var oFromDatePicker = this.getView().byId("idFromDatePicker");
        if (!oFromDatePicker.getDateValue()) {
          // set the training period begin date onload
          oFromDatePicker.setDateValue(this._getBeginDate(this._sCacheId));
        }

        // Close dialog and resolve promise
        this.closeBusyDialog();
        oPromise.resolve();
      }, this));

      // Return our promise - it will not be resolved until data is loaded
      // and the page is bound.
      return oPromise;
    };

    /**
     * When the effective date is changed, we perform some quick checks to make
     * sure the effective date is valid. That is, it cannot be greater than the
     * cache end date, or earlier than the cache begin date.
     * @param  {object} oEvent Selection change event
     */
    Wizard.prototype.onToDateChange = function(oEvent) {
      this._validateToDatePicker(oEvent.getSource(), this._utc(new Date(oEvent.getParameter("value"))));
    };

    /**
     *
     * @param  {object} oEvent Selection change event
     */
    Wizard.prototype.onHorizonChange = function(oEvent) {
      // When the horizon is entered, automatically populate the validation
      // period to be the same (if it's empty)
      this._validateHorizonInput(oEvent.getSource(), oEvent.getParameter("value"));
    };

    /**
     *
     * @param  {object} oEvent Selection change event
     */
    Wizard.prototype.onFromDateChange = function(oEvent) {
      this._validateFromDatePicker(oEvent.getSource(), this._utc(new Date(oEvent.getParameter("value"))));
    };

    /**
     *
     * @param  {object} oEvent Selection change event
     */
    Wizard.prototype.onValidationChange = function(oEvent) {
      this._validateValidationInput(oEvent.getSource(), oEvent.getParameter("value"));
    };

    /**
     * Okay, we have everything we need for a forecast. Let's check the horizon, effective
     * date, validation and training periods all check out.
     * Submit the batch jobs, to create the forecast and variables, then run it.
     * @param  {Function} done  Done callback
     * @param  {Function} error Error callback
     */
    Wizard.prototype.validateParamsPage = function(done, error) {

      var get = jQuery.proxy(this.getControl, this);

      // Flag
      var bValid = true;

      // Effective Date
      if (!this._validateToDatePicker(get("idToDatePicker"))) {
        bValid = false;
      }

      // Horizon input
      if (!this._validateHorizonInput(get("idHorizonInput"))) {
        bValid = false;
      }

      // From date
      if (!this._validateFromDatePicker(get("idFromDatePicker"))) {
        bValid = false;
      }

      // Validation input
      if (!this._validateValidationInput(get("idValidationInput"))) {
        bValid = false;
      }

      // If not valid, return
      if (!bValid) {
        return error();
      }

      // We need to collect all the relevant dets for a new forecast.
      var oForecast = this._buildForecast();

      // add the forecast into our batch operations too!
      var oModel = this.getView().getModel("forecast");
      this._aBatchOps.push(oModel.createBatchOperation(
        "/Forecasts",
        "POST",
        oForecast
      ));

      // Add the forecast field, which we will predict
      this._aBatchOps.push(oModel.createBatchOperation(
        "/Fields",
        "POST", {
          forecast_id: this._sForecastId,
          dimension_id: this._oFields.forecast,
          type: "forecast"
        }));

      // And add any variable fields
      for (var i = 0; i < this._oFields.variables.length; i++) {
        this._aBatchOps.push(oModel.createBatchOperation(
          "/Fields",
          "POST", {
            forecast_id: this._sForecastId,
            dimension_id: this._oFields.variables[i],
            type: "variable"
          }));
      };

      done();
    };

    /**
     * Builds a forecast object wrapper using values pulled from the
     * form fields, and from global variables.
     * @return {object} Forecast object
     */
    Wizard.prototype._buildForecast = function() {

      var get = jQuery.proxy(function(sId) {
        return this.getView().byId(sId);
      }, this);

      // Collect the values from all of our inputs.
      return {
        id: this._sForecastId,
        folder_id: this._sFolderId,
        dataset_id: this._sDataSetId,
        name: get("idNewForecastNameInput").getValue(),
        created: new Date(Date.now()),
        begda: new Date(Date.now()),
        endda: new Date("9999-12-31T23:59:59"),
        user: this.getUserId(),
        train_to: new Date(get("idToDatePicker").getValue()),
        train_from: new Date(get("idFromDatePicker").getValue()),
        horizon: parseInt(get("idHorizonInput").getValue(), 10),
        validation: parseInt(get("idValidationInput").getValue(), 10),
        smoothing: (get("idSmoothingCheckBox").getSelected() ? "X" : " "),
        frequency: parseInt(get("idFrequencySelect").getSelectedKey(), 10),
        running: " ",
        favorite: " "
      };
    };

    /***
     *    ██████╗  ██████╗ ███╗   ██╗███████╗
     *    ██╔══██╗██╔═══██╗████╗  ██║██╔════╝
     *    ██║  ██║██║   ██║██╔██╗ ██║█████╗
     *    ██║  ██║██║   ██║██║╚██╗██║██╔══╝
     *    ██████╔╝╚██████╔╝██║ ╚████║███████╗
     *    ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝
     *
     */

    /**
     * The forecast is now running. Would they like a notficiation when it's done?
     */
    Wizard.prototype.setupDonePage = function() {

      // Indicate the forecast is commencing.
      this.showBusyDialog({
        title: "Forecasting",
        text: "Firing up the Predicto-matic - one moment please...",
        showCancelButton: false
      });

      var oCreatedPromise = jQuery.Deferred();
      var oRunPromise = jQuery.Deferred();
      var oModel = this.getView().getModel("forecast");

      // Load up the batch changes, and submit.
      oModel.addBatchChangeOperations(this._aBatchOps);
      oModel.submitBatch(jQuery.proxy(function(oData, oResponse, aErrorResponses) {
          // we can resolve the creation promise
          oCreatedPromise.resolve();
          this._aBatchOps = [];
        }, this),
        jQuery.proxy(function(oError) {
          // we can resolve the creation promise
          //oCreatedPromise.resolve();
        }, this),
        /* bAsync= */
        true,
        /* bImportData= */
        true
      );

      var oRun = {
        id: "",
        forecast_id: this._sForecastId,
        run_at: new Date(Date.now()),
        user: this.getUserId()
      };

      // When we know the forecast has been created, we can run it...
      jQuery.when(oCreatedPromise).then(jQuery.proxy(function() {
        oModel.create("/Runs", oRun, {
          success: jQuery.proxy(function(oData, mResponse) {
            this.closeBusyDialog();

            // and resolve, so that page navigation continues
            oRunPromise.resolve();
          }, this),
          error: jQuery.proxy(function(mError) {

            this.closeBusyDialog();
            //oRunPromise.resolve();
          }, this),
          async: true
        });
      }, this));

      // return our submitted promise
      return oRunPromise;
    };

    /**
     * Validates the details of step 7 - this is just collecting a user's
     * notification request
     * @param  {Function} done  Done callback
     * @param  {Function} error Error callback
     */
    Wizard.prototype.validateDonePage = function(done, error) {
      done();
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
     * Validate the effective date picker
     * @param  {[type]} oControl [description]
     * @param  {[type]} dDate    [description]
     * @return {[type]}          [description]
     */
    Wizard.prototype._validateToDatePicker = function(oControl, dDate) {
      // Date is optional. If it's not provided, take it from the control
      if (!dDate) {
        dDate = new Date(oControl.getValue());
      }

      var dMaxDate = this._getMaxDate(this._sCacheId);
      var dMinDate = this._getBeginDate(this._sCacheId);
      var bValid = false;

      // Now check that dDate is not greater than dMaxDate
      if (dDate > dMaxDate) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("Date cannot be greater than " + this._string(dMaxDate));
        bValid = false;
      } else if (dDate <= dMinDate) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("Date must be greater than " + this._string(dMinDate));
        bValid = false;
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
        oControl.setValueStateText("");
        bValid = true;
      }

      return bValid;
    };

    /**
     * [function description]
     * @param  {[type]} oInput [description]
     * @return {[type]}        [description]
     */
    Wizard.prototype._validateHorizonInput = function(oControl, sValue) {
      var bValid = false;
      if (!sValue) {
        sValue = oControl.getValue();
      }

      if (!sValue) {
        oControl.setValue("0"); // 0 days
        sValue = 0;
      }

      var i = parseInt(sValue, 10);

      // Now check that dDate is not greater than dMaxDate
      if (isNaN(i)) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("The horizon should only be a number");
        bValid = false;
      } else if (i <= 0) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("Horizon must be greater than 0 days");
        bValid = false;
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
        oControl.setValueStateText("");
        bValid = true;
      }

      return bValid;
    };

    /**
     * Validate the training date picker
     * @param  {[type]} oControl [description]
     * @param  {[type]} dDate    [description]
     * @return {[type]}          [description]
     */
    Wizard.prototype._validateFromDatePicker = function(oControl, dDate) {
      // Date is optional. If it's not provided, take it from the control
      if (!dDate) {
        dDate = new Date(oControl.getValue());
      }

      var dMaxDate = this._getMaxDate(this._sCacheId);
      var dMinDate = this._getBeginDate(this._sCacheId);
      var bValid = false;

      if (dDate < dMinDate) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("Date cannot be less than " + this._string(dMinDate));
        bValid = false;
      } else if (dDate >= dMaxDate) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("Date must be less than " + this._string(dMaxDate));
        bValid = false;
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
        oControl.setValueStateText("");
        bValid = true;
      }

      return bValid;
    };

    /**
     * [function description]
     * @param  {[type]} oInput [description]
     * @return {[type]}        [description]
     */
    Wizard.prototype._validateValidationInput = function(oControl, sValue) {
      var bValid = false;
      if (!sValue) {
        sValue = oControl.getValue();
      }

      if (!sValue) {
        oControl.setValue("0"); // 0 days
        sValue = 0;
      }

      var i = parseInt(sValue, 10);
      var dMaxDate = this._getMaxDate(this._sCacheId);
      var dMinDate = this._getBeginDate(this._sCacheId);
      var oneDay = 24 * 60 * 60 * 1000;
      var diff = Math.round(Math.abs((dMinDate.getTime() - dMaxDate.getTime()) / (oneDay)));

      // Now check that validation is not greater than the total training period
      if (isNaN(i)) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("The validation period should only be a number");
        bValid = false;
      } else if (i > diff) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("Validation period must not be greater than " + diff + " days");
        bValid = false;
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
        oControl.setValueStateText("");
        bValid = true;
      }

      return bValid;
    };

    /***
     *     █████╗ ██╗     ██╗      ██████╗ ██╗    ██╗ █████╗ ███╗   ██╗ ██████╗███████╗
     *    ██╔══██╗██║     ██║     ██╔═══██╗██║    ██║██╔══██╗████╗  ██║██╔════╝██╔════╝
     *    ███████║██║     ██║     ██║   ██║██║ █╗ ██║███████║██╔██╗ ██║██║     █████╗
     *    ██╔══██║██║     ██║     ██║   ██║██║███╗██║██╔══██║██║╚██╗██║██║     ██╔══╝
     *    ██║  ██║███████╗███████╗╚██████╔╝╚███╔███╔╝██║  ██║██║ ╚████║╚██████╗███████╗
     *    ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
     *
     */

    /**
     * Determines whether the user is allowed to create any more forecasts,
     * in accordance with the allowances of their plan.
     * @param  {Deferred} Promise
     * @return {Boolean}  Allowed?
     */
    Wizard.prototype._isAllowedNew = function(oPromise) {

      // checks the total amount of data the user has against the total
      // amount their plan allows for. if they're over, then they cannot Create
      // a new data set until they get rid of something.
      this.showBusyDialog({});

      // read in the total amount currently used...
      var oTotalPromise = jQuery.Deferred();
      var iCount = 0;
      this._readMonthsForecastCount(this.getProfileId(), oTotalPromise, function(count) {
        iCount = count;
      });

      // and plan allowance
      var oLimitPromise = jQuery.Deferred();
      var iLimit = 0;
      this._readPlanLimit(this.getProfileId(), oLimitPromise, function(limit) {
        iLimit = limit;
      });

      // When all of our async reads have come back
      var self = this;
      jQuery.when(oTotalPromise).done(function() {
        jQuery.when(oLimitPromise).done(function() {
          // Now compare. If fTotal is greater than fLimit, then no more data sets are allowed.
          if (iCount >= iLimit && iLimit !== 0) { // 0 means unlimited
            // Hide busy
            self.hideBusyDialog();

            // Alert, you're over!
            self.showInfoAlert(
              "Yikes! You're over your plan's monthly forecast allowance! You'll have to wait until next month, or upgrade your account to continue forecasting.",
              "Plan forecast limit reached",
              sap.ui.Device.system.phone
            );
            oPromise.reject();
          } else {
            // Set up last checked moment
            self._isAllowedCheckTime = moment();
            self._isAllowed = true;

            // Hide busy
            self.hideBusyDialog();
            oPromise.resolve();
          }
        });
      });
    };

    /**
     * Async read of the user's total forecasts for this month, and when done, executes a callback
     * and resolves a promise. I use promises so that we don't end up Christmas treeing.
     * @param  {String}   sProfileId Profile ID
     * @param  {Deferred} oPromise   Deferred promise
     * @param  {Function} fnCb       Callback function
     */
    Wizard.prototype._readMonthsForecastCount = function(sProfileId, oPromise, callback) {
      // Model for reading
      var oModel = this.getView().getModel("forecast");

      // first check if the model has the data we want...
      oModel.read("/ForecastIds", {
        async: true,
        filters: [new sap.ui.model.Filter({
          path: 'month(created)',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: new Date(Date.now()).getMonth() + 1 // remeber, months start at 0
        }), new sap.ui.model.Filter({
          path: 'user',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: "TESTUSER"
        })],
        success: jQuery.proxy(function(oData, mResponse) {
          // Callback and resolve
          try {
            callback(oData.results.length);
          } catch (e) {}
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {
          // What to do?
        }, this)
      });
    };

    /**
     * Async read of the user's current plan forecast monthly limit. When done, executes a callback
     * and resolves a promise. I use promises so that we don't end up Christmas treeing.
     * @param  {String}   sProfileId Profile ID
     * @param  {Deferred} oPromise   Deferred promise
     * @param  {Function} fnCb       Callback function
     */
    Wizard.prototype._readPlanLimit = function(sProfileId, oPromise, fnCb) {
      // Model for reading
      var oModel = this.getView().getModel("profile");

      // first check if the model has the data we want...
      var sPath = "/CurrentSubscriptions('" + sProfileId + "')";
      var oPlan = oModel.getProperty(sPath);
      if (oPlan) {
        // Callback and resolve
        try {
          fnCb(oPlan.forecast_limit);
        } catch (e) {}
        oPromise.resolve();
      } else {
        oModel.read(sPath, {
          async: true,
          success: jQuery.proxy(function(oData, mResponse) {
            // Callback and resolve
            try {
              fnCb(oData.forecast_limit);
            } catch (e) {}
            oPromise.resolve();
          }, this),
          error: jQuery.proxy(function(mError) {
            // What to do?
          }, this)
        })
      }
    };

    return Wizard;

  }, /* bExport= */ true);
