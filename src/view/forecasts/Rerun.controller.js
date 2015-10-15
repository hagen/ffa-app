jQuery.sap.declare("com.ffa.hpc.view.forecasts.Rerun");
jQuery.sap.require("com.ffa.hpc.thirdparty.shortid.ShortId");
jQuery.sap.require("com.ffa.hpc.util.DateFormatter");

sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/view/forecasts/DatasetAuth'],
  function(jQuery, Controller) {
    "use strict";

    var Rerun = Controller.extend("com.ffa.hpc.view.forecasts.Rerun", /** @lends com.ffa.hpc.view.forecasts.Rerun.prototype */ {
      _sCacheId: "",
      _sForecastId: "",
      _sReturnRoute: ""
    });

    /**
     * On init handler
     */
    Rerun.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("rerun").attachPatternMatched(this._onRouteMatched, this);
    };

    Rerun.prototype.onExit = function() {};

    Rerun.prototype.onBeforeRendering = function() {};

    Rerun.prototype.onAfterRendering = function() {};

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
    Rerun.prototype._onRouteMatched = function(oEvent) {
      this.checkMetaDataLoaded("forecast");

      // Busy.
      this.showBusyDialog();

      var oParameters = oEvent.getParameters();
      this._sForecastId = oParameters.arguments.forecast_id;
      this._sReturnRoute = oParameters.arguments.return_route;

      // get latest Cache entry for this forecast
      this.getLatestCacheId(this._sForecastId, jQuery.proxy(function(sCacheId) {

        // Bind the dialog to the most recent cache entry for this Forecast
        var oPage = this.getView().byId("idRerunPage");

        // Continue on...
        this._sCacheId = sCacheId;
        var sPath = "/Cache('" + this._sCacheId + "')";
        oPage.bindElement("forecast>" + sPath, {
          expand: "Forecast"
        });

        // If the model already has this Cache entry in it, there's no need for
        // the attachDataReceived event handler.
        if (this.getView().getModel("forecast").getProperty(sPath) === undefined) {
          // When the dialog has bound to the path, we can hide the busy dialog
          oPage.getElementBinding("forecast").attachDataReceived(this._handlePageBound, this);
        } else {
          // we're no longer busy
          this.hideBusyDialog();
        }
      }, this), jQuery.proxy(function() {
        // Couldn't bind the page. What to do now?
      }, this));
    };

    /**
     * Navigate within the NavContainer backwards (no routing occurs here)
     * @param  {object} oEvent Button press event
     */
    Rerun.prototype.onNavBackPress = function(oEvent) {

      // If the route requires a folder Id, we'll get this and add it to the
      // params.
      var oParams = {
        forecast_id: this._sForecastId
      };

      // If we came from folders, then we need the folder to come back...
      if (this._sReturnRoute.indexOf('folder') > -1) {
        oParams.folder_id = this.getView().getModel("forecast").getProperty("/Forecasts('" + this._sForecastId + "')/folder_id");
        this.getRouter().navTo(this._sReturnRoute, oParams, !sap.ui.Device.system.phone);
      } else {
        this.getRouter().navTo("folders", {}, !sap.ui.Device.system.phone);
      }
    };

    /***
     *    ██████╗  █████╗  ██████╗ ███████╗    ██████╗ ██╗███╗   ██╗██████╗ ██╗███╗   ██╗ ██████╗
     *    ██╔══██╗██╔══██╗██╔════╝ ██╔════╝    ██╔══██╗██║████╗  ██║██╔══██╗██║████╗  ██║██╔════╝
     *    ██████╔╝███████║██║  ███╗█████╗      ██████╔╝██║██╔██╗ ██║██║  ██║██║██╔██╗ ██║██║  ███╗
     *    ██╔═══╝ ██╔══██║██║   ██║██╔══╝      ██╔══██╗██║██║╚██╗██║██║  ██║██║██║╚██╗██║██║   ██║
     *    ██║     ██║  ██║╚██████╔╝███████╗    ██████╔╝██║██║ ╚████║██████╔╝██║██║ ╚████║╚██████╔╝
     *    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚═════╝ ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝
     *
     */

    /**
     * When the page binding receives data, this handler is called to load up
     * the page
     * @param  {Event} oEvent Data received event
     */
    Rerun.prototype._handlePageBound = function(oEvent) {
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

      // When the dialog has bound to the path, we can hide the busy dialog
      oEvent.getSource().detachDataReceived(this._handlePageBound, this);

      // we're no longer busy
      this.hideBusyDialog();
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
     * Reset all pages in the screen.
     * @return {[type]} [description]
     */
    Rerun.prototype._reset = function() {

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
      this._sForecastId = "";
      this._sReturnRoute = "";
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
     * On press, the cache is refreshed. This is an optional step, and not
     * forced upon the user when rerunning.
     * @param  {Event} oEvent Button presss event
     */
    Rerun.prototype.onRefreshCachePress = function(oEvent) {

      // if there were any problems, alert - There are no problems here...
      // Show the busy dialog...
      this.openBusyDialog({
        title: "Caching data",
        text: "One moment please - refreshing data set cache",
        showCancelButton: false
      });

      // Now we wait for the cache promise
      jQuery.when(this._refreshCache()).then(jQuery.proxy(function() {

        // Bind the dialog to the most recent cache entry for this Forecast
        var oPage = this.getView().byId("idRerunPage");

        // Continue on... there will be a new global Cache Id
        var sPath = "/Cache('" + this._sCacheId + "')";
        oPage.bindElement("forecast>" + sPath, {
          expand: "Forecast"
        });

        // When the dialog has bound to the path, we can hide the busy dialog
        oPage.getElementBinding("forecast").attachDataReceived(this._handlePageBound, this);
      }, this));
    };

    /**
     * On press of the rerun button, the screen is validated, as per creating
     * a forecast, and then a new run is submitted.
     * @param  {Event} oEvent Button press event
     */
    Rerun.prototype.onRerunPress = function (oEvent) {

      if (!this.validateParameters()) {
        return;
      }

      // We're now busy, as we have some things to check!
      this.showBusyDialog({});

      // Collect the forecast data set Id
      var sDatasetId = this.getView().getModel("forecast").getProperty("/Forecasts('" + this._sForecastId + "')/dataset_id");

      // Firstly, we'll check if the attached data set requires auth or not.
      // Maybe prompt the user for authentication
      var oPromise = jQuery.Deferred();

      // NOTE: this function lives down in the DatasetAuth Controller
      this.maybeAuthenticateDataset(sDatasetId, oPromise);

      jQuery.when(oPromise)
        // if the promise is resolved, then we can advance
        .done(jQuery.proxy(function() {
          // Update the forecast with the new details. Updating the forecast returns
          // a promise.
          jQuery.when(this._updateForecast()).then(jQuery.proxy(function() {
            // Now we can re-run. Re run returns a promise, so
            // just wait until it's resolved
            jQuery.when(this._rerun()).then(jQuery.proxy(function() {
              this.getEventBus().publish("Rerun", "Complete");

              // Update the busy dialog
              this.updateBusyDialog({
                title : "All done",
                text : "Right, looks like it's finished! I'll take you back to the forecast"
              });
              jQuery.sap.delayedCall(1500, this, function() {
                this.hideBusyDialog();
                // back we go!
                this.getView().byId("idRerunPage").fireNavButtonPress();
              }, []);
              // and nav back to the forecast
            }, this));
          }, this));

          // Not busy
          this.hideBusyDialog();
        }, this))
        // if not, then do not go anywhere...
        .fail(jQuery.proxy(function() {

          // Not busy
          this.hideBusyDialog();
        }, this));
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
    Rerun.prototype._refreshCache = function() {
      var oPromise = jQuery.Deferred();

      // Do the read
      this.getView().getModel("forecast").create("/Cache", this._getCacheData(), {
        success: jQuery.proxy(function(oData, mResponse) {
          // If we successfully read the cache, then we'll resolve this promise
          // so user doesn't have to wait for a refresh later.
          // We also need to set the new Global Cache Id
          this._sCacheId = oData.id;
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {
          oPromise.reject();
        }, this),
        async: true
      });

      return oPromise;
    };

    /**
     * Compile all necessary attributes to create cache. Note, these are mostly
     * dummy attributes.
     * @return {object} Cache object
     */
    Rerun.prototype._getCacheData = function() {

      return {
        id: ShortId.generate(10),
        forecast_id: this._sForecastId,
        dataset_id: this.getForecast(this._sForecastId).dataset_id,
        created_at: new Date(Date.now()),
        user: this.getProfileId(),
        columns: 0, // not required
        bytes: 0, // not required
        begda: new Date(0), // not required
        endda: new Date(0) // not required
      };
    };

    /***
     *    ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
     *    ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
     *    ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   ██║██║   ██║██╔██╗ ██║
     *    ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
     *     ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
     *      ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    /**
     * When the effective date is changed, we perform some quick checks to make
     * sure the effective date is valid. That is, it cannot be greater than the
     * cache end date, or earlier than the cache begin date.
     * @param  {object} oEvent Selection change event
     */
    Rerun.prototype.onToDateChange = function(oEvent) {
      this._validateToDatePicker(oEvent.getSource(), this._utc(new Date(oEvent.getParameter("value"))));
    };

    /**
     *
     * @param  {object} oEvent Selection change event
     */
    Rerun.prototype.onHorizonChange = function(oEvent) {
      // When the horizon is entered, automatically populate the validation
      // period to be the same (if it's empty)
      this._validateHorizonInput(oEvent.getSource(), oEvent.getParameter("value"));
    };

    /**
     *
     * @param  {object} oEvent Selection change event
     */
    Rerun.prototype.onFromDateChange = function(oEvent) {
      this._validateFromDatePicker(oEvent.getSource(), this._utc(new Date(oEvent.getParameter("value"))));
    };

    /**
     *
     * @param  {object} oEvent Selection change event
     */
    Rerun.prototype.onValidationChange = function(oEvent) {
      this._validateValidationInput(oEvent.getSource(), oEvent.getParameter("value"));
    };

    /**
     * Okay, we have everything we need for a forecast. Let's check the horizon, effective
     * date, validation and training periods all check out.
     * Submit the batch jobs, to create the forecast and variables, then run it.
     * @return {boolean} Valid step details
     */
    Rerun.prototype.validateParameters = function() {

      var oView = this.getView();

      // Return the result
      return (this._validateToDatePicker(oView.byId("idToDatePicker"))  // Effective Date
              && this._validateHorizonInput(oView.byId("idHorizonInput")) // Horizon input
                && this._validateFromDatePicker(oView.byId("idFromDatePicker")) // Training date
                  && this._validateValidationInput(oView.byId("idValidationInput"))) // Validation input
    };

    /**
     * Validate the effective date picker
     * @param  {[type]} oControl [description]
     * @param  {[type]} dDate    [description]
     * @return {[type]}          [description]
     */
    Rerun.prototype._validateToDatePicker = function(oControl, dDate) {
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
    Rerun.prototype._validateHorizonInput = function(oControl, sValue) {
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
    Rerun.prototype._validateFromDatePicker = function(oControl, dDate) {
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
    Rerun.prototype._validateValidationInput = function(oControl, sValue) {
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
     *    ███████╗ ██████╗ ██████╗ ███████╗ ██████╗ █████╗ ███████╗████████╗
     *    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██╔════╝╚══██╔══╝
     *    █████╗  ██║   ██║██████╔╝█████╗  ██║     ███████║███████╗   ██║
     *    ██╔══╝  ██║   ██║██╔══██╗██╔══╝  ██║     ██╔══██║╚════██║   ██║
     *    ██║     ╚██████╔╝██║  ██║███████╗╚██████╗██║  ██║███████║   ██║
     *    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝
     *
     */

    /**
     * Updates this forecast with data from the form.
     * @return {Event} Button press event
     */
    Rerun.prototype._updateForecast = function () {
      // Indicate the forecast is commencing.
      this.showBusyDialog({
        title: "Updating forecast",
        text: "Just applying your new parameters to the forecast...",
        showCancelButton: false
      });

      var oPromise = jQuery.Deferred();
      var get = jQuery.proxy(function(sId) {
        return this.getView().byId(sId);
      }, this);

      var oModel = this.getView().getModel("forecast");
      var oForecast = {
        train_from : new Date(get("idFromDatePicker").getValue()),
        train_to : new Date(get("idToDatePicker").getValue()),
        horizon : parseInt(get("idHorizonInput").getValue(), 10),
        validation : parseInt(get("idValidationInput").getValue(), 10),
        frequency : parseInt(get("idFrequencySelect").getSelectedKey(), 10),
        smoothing : (get("idSmoothingCheckBox").getSelected() ? "X" : " ")
      };

      // When we know the forecast has been created, we can run it...
      oModel.update("/Forecasts('" + this._sForecastId + "')", oForecast, {
        merge : true,
        success: jQuery.proxy(function(oData, mResponse) {
          // and resolve, so that page navigation continues
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {

          this.closeBusyDialog();
          this.showErrorAlert("Error updating forecast");
          oPromise.reject();
        }, this),
        async: true
      });

      // return our submitted update promise
      return oPromise;
    };

    /***
     *    ██████╗ ███████╗    ██████╗ ██╗   ██╗███╗   ██╗
     *    ██╔══██╗██╔════╝    ██╔══██╗██║   ██║████╗  ██║
     *    ██████╔╝█████╗█████╗██████╔╝██║   ██║██╔██╗ ██║
     *    ██╔══██╗██╔══╝╚════╝██╔══██╗██║   ██║██║╚██╗██║
     *    ██║  ██║███████╗    ██║  ██║╚██████╔╝██║ ╚████║
     *    ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    /**
     * Rerun the forecast by submitting another Run object
     * @return {[type]} [description]
     */
    Rerun.prototype._rerun = function() {

      // Indicate the forecast is commencing.
      this.updateBusyDialog({
        title: "Re-running forecast",
        text: "Shouldn't be longer than a few moments...",
        showCancelButton: false
      });

      var oPromise = jQuery.Deferred();
      var oModel = this.getView().getModel("forecast");

      var oRun = {
        id: "",
        forecast_id: this._sForecastId,
        run_at: new Date(Date.now()),
        user: this.getProfileId()
      };

      // When we know the forecast has been created, we can run it...
      oModel.create("/Runs", oRun, {
        success: jQuery.proxy(function(oData, mResponse) {

          // and resolve, so that page navigation continues
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {

          this.closeBusyDialog();
          this.showErrorAlert("Error re-running forecast");
          oPromise.reject();
        }, this),
        async: true
      });

      // return our submitted run promise
      return oPromise;
    };

    return Rerun;

  }, /* bExport= */ true);
