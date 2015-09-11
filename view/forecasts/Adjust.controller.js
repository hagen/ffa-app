jQuery.sap.declare("view.forecasts.Adjust");
jQuery.sap.require("util.DateFormatter");

// Provides controller forecasts.Adjust
sap.ui.define(["jquery.sap.global", "view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Adjust = Controller.extend("view.forecasts.Adjust", /** @lends view.forecasts.Adjust.prototype */ {
      _sForecastId: "",
      _sRunId: "",
      _sReturnRoute: "",
      _aBatchOps: [],
      _timerRunning: false
    });

    /**
     * On init handler
     */
    Adjust.prototype.onInit = function() {

      // Route handler
      this.getRouter().getRoute("adjust").attachPatternMatched(this._onRouteMatched, this);
    };

    Adjust.prototype.onExit = function() {};

    Adjust.prototype.onBeforeRendering = function() {};

    Adjust.prototype.onAfterRendering = function() {};

    /***
     *    ██████╗  ██████╗ ██╗   ██╗████████╗███████╗███████╗
     *    ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔════╝
     *    ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ███████╗
     *    ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ╚════██║
     *    ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗███████║
     *    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚══════╝
     *
     */

    /**
     * When a route is matched, we always need the forecast ID; all of
     * the preceding route handlers will use this function.
     * @param  {object} oEvent Route matched event
     */
    Adjust.prototype._onRouteMatched = function(oEvent) {
      this._checkMetaDataLoaded("forecast");

      var oParameters = oEvent.getParameters();
      this._sForecastId = oParameters.arguments.forecast_id;
      this._sRunId = oParameters.arguments.run_id;
      this._sReturnRoute = oParameters.arguments.return_route;

      // Bind the page to the supplied Forecast run
      let oPage = this.getView().byId("idAdjustPage");
      oPage.bindElement("forecast>/Runs('" + this._sRunId + "')", {
        expand: "Forecast"
      });

      // attach to page element binding events
      let oBinding = oPage.getElementBinding("forecast");
      oBinding.attachEventOnce("dataReceived", jQuery.proxy(function() {

        // Get the nav container
        let oNavContainer = this.getView().byId("idNavContainer");

        // Check that this run belongs to this forecast
        let oContext = oPage.getBindingContext('forecast');
        if (oContext.getProperty("forecast_id") !== this._sForecastId) {
          oNavContainer.to(this.getView().byId("idMessagePage"));
        } else if (!oNavContainer.currentPageIsTopPage()) {
          oNavContainer.backToTop();
        }

        // And build a JSON model to represent some important metrics for the viz
        let mRange = new sap.ui.model.json.JSONModel();
        mRange.setDefaultBindingMode("TwoWay");
        mRange.setData({
          lower: this._calcSelectionLower(),
          mid: this._calcSelectionMid(),
          upper: this._calcSelectionUpper(),
          from: null,
          to: null,
          selected: 0,
          from: null,
          to: null
        });
        this.getView().setModel(mRange, "range");

        // Draw the chart that allows mods
        this._maybeDrawViz(true /* bRefresh */ );
      }, this));
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
     * Navigate back to the forecast from which we've come. The trick here is to
     * ensure you navigate back to the correct route. We save the route when
     * the route pattern is matched, however, we may need (depending on the route)
     * to also send some parameters back (like folder_id, for example).
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Adjust.prototype.onDonePress = function(oEvent) {

      // If needs be, we're going to submit our changes (if any) to the back end.


      // If the route requires a folder Id, we'll get this and add it to the
      // params.
      let oParams = {
        forecast_id: this._sForecastId
      };

      // Do we also need a folder?
      if (this._sReturnRoute.indexOf('folder') > -1) {
        oParams.folder_id = this.getView().getModel("forecast").getProperty("/Adjust('" + this._sForecastId + "')/folder_id");
      }

      // Do the routing
      this.getRouter().navTo(this._sReturnRoute, oParams, !sap.ui.Device.system.phone);
    };

    /**
     * Cancel - undo all changes and nav back
     * @param  {Event} oEvent Button press Event
     */
    Adjust.prototype.onCancelPress = function(oEvent) {

    };

    /**
     * Export using Highcharts export server
     * @param  {Event} oEvent Button press Event
     */
    Adjust.prototype.onExportPress = function(oEvent) {
      // check we have a chart, and then call export on it, providing a larger size
      if (!this._oChart) {
        this.showInfoAlert("Oops. You don't yet have a chart to export", "No chart to export");
        return;
      }

      // Export at larger dimensions
      this._oChart.exportChart(null, {
        chart: {
          height: 720,
          width: 1280
        }
      });
    };

    /**
     * Clear all selected points
     * @param  {Event} oEvent Button press Event
     */
    Adjust.prototype.onClearRangePress = function(oEvent) {
      this._deselectAllPoints();
    };

    /**
     * Handles button press for the date range pop-up
     */
    Adjust.prototype.onDateRangePress = function(oEvent) {
      // Init the date range selection popover if necesary
      if (!this._oDateRangePopover) {

        // Supply this controller to that controller, and open the settings frag
        this._oDateRangePopover = sap.ui.xmlfragment("idDateRangeFragment", "view.forecasts.DateRangePopover", this);

        // Add dependent is very important - it ensures the model is retained in the fragment
        this.getView().addDependent(this._oDateRangePopover);
      }

      // delay because addDependent will do a async rerendering and the popover will immediately close without it
      let oButton = oEvent.getSource();
      jQuery.sap.delayedCall(0, this, function() {
        this._oDateRangePopover.openBy(oButton);
      });
    };

    /**
     * The Gain press button is only enabled when in Edit mode.
     * @param oEvent the inbound event
     */
    Adjust.prototype.onGainPress = function(oEvent) {

      let fragment = function(sId) {
        return sap.ui.core.Fragment.byId("idSeriesGainFragment", sId);
      };

      // Collect the TOTAL series points that are currently selected; these will be
      // updated
      this._aPoints = this._getSelectedPoints();

      // if the user hasn't selected any points, show an error
      if (this._aPoints.length === 0) {
        this.showInfoAlert("Oops, looks like you haven't selected any points to adjust", "No points selected");
        return;
      }

      // show the gain control (it's a popover, situated under the gain button
      if (!this._oGainPopover) {
        this._oGainPopover = sap.ui.xmlfragment("idSeriesGainFragment", "view.forecasts.GainPopover", this);
        // Add dependent is very important - it ensures the model is retain in the fragment
        this.getView().addDependent(this._oGainPopover);
      }

      // Set the icon color, to correctly represent the series
      fragment("idSliderColorIcon").setColor(this._aPoints[0].series.color);

      // Reset slider value
      fragment("idSlider").setValue(0);
      fragment("idSliderInput").setValue(null);

      // delay because addDependent will do a async rerendering and the popover will immediately close without it
      // Retain the button - it is lost after the delayed called below
      var oButton = oEvent.getSource();
      jQuery.sap.delayedCall(0, this, function() {
        this._oGainPopover.openBy(oButton);
      });
    };

    /***
     *    ██████╗  █████╗ ████████╗███████╗    ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝    ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝
     *    ██║  ██║███████║   ██║   █████╗      ██████╔╝███████║██╔██╗ ██║██║  ███╗█████╗
     *    ██║  ██║██╔══██║   ██║   ██╔══╝      ██╔══██╗██╔══██║██║╚██╗██║██║   ██║██╔══╝
     *    ██████╔╝██║  ██║   ██║   ███████╗    ██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
     *
     */

    /**
     * Handles cancellation/close of the date range selector
     * @param oEvent the button event
     */
    Adjust.prototype.onDateRangeCancelPress = function(oEvent) {
      if (this._oDateRangePopover) {
        this._oDateRangePopover.close();
      }
    };

    /**
     * Handles click of the Okay button; this entails validation of the selected dates,
     * ensuring they are within the allowable bounds of the forecast's range
     * @param oEvent the button event
     */
    Adjust.prototype.onDateRangeOkPress = function(oEvent) {
      let oRangePicker = sap.ui.core.Fragment.byId("idDateRangeFragment", "idDateRange");
      let mRange = this.getView().getModel("range");
      let dFrom = new Date(mRange.getProperty("/from"));
      let dTo = new Date(mRange.getProperty("/to"));
      let count = 0;

      // perform validation on the dates (possibly again)
      if (!this._validDateRange(dFrom, dTo, oRangePicker)) {
        return;
      }

      // Set to busy...
      this._oDateRangePopover.setBusy(true);

      // deselect all points
      this._deselectAllPoints();

      // continue on - select points on the adjustable total plot line
      let oSeries = this._getAdjustableSeries();
      let that = this;

      // Select points that are within the range
      jQuery.each(oSeries.data, function(ix, oPoint) {
        // Highcharts points are in timezone date, so we'll do the compare in UTC
        if (that._date(oPoint.x) >= that._date(dFrom) && that._date(oPoint.x) <= that._date(dTo)) {
          oPoint.select(true /* select? */ , true /* accumulate */ );
          count++;
        }
      });

      // Update the model and force binding update.
      mRange.setProperty("/selected", count);

      // close date range selector
      this.onDateRangeCancelPress(null /* oEvent */ );

      // Not busy anymore
      this._oDateRangePopover.setBusy(false);
    };

    /**
     * Handler for the change event of the date range picker; two dates are supplied,
     * and we will use these to
     * (1) validate the date range is within the displayed bounds
     * (2) select points on the chart of the adjustable total
     * (3) highlight the section of chart that has been selected
     */
    Adjust.prototype.onDateRangeChange = function(oEvent) {
      var oButton = sap.ui.core.Fragment.byId("idDateRangeFragment", "idDateRangeOkButton"),
        dFrom = oEvent.getParameter("from"),
        dTo = oEvent.getParameter("to");

      // Check that the value is valid
      if (!this._validDateRange(dFrom, dTo, oEvent.getSource())) {
        // set Ok button to disabled
        oButton.setEnabled(false);
        // return
        return;
      } else {
        // Enable the OK button, and ensure the correct values are in the JSON model
        oButton.setEnabled(true);
        var mRange = this.getView().getModel("range");
        mRange.setProperty("/from", dFrom);
        mRange.setProperty("/to", dTo);
      }
    };

    /**
     * Checks the supplied dates against the forecast's range, and updates the control
     * status state/text as appropriate; returns true/false for validation
     * @param dFrom
     * @param dTo
     * @param oControl
     * @return bValid
     */
    Adjust.prototype._validDateRange = function(dFrom, dTo, oControl) {
      var oButton = sap.ui.core.Fragment.byId("idDateRangeFragment", "idDateRangeOkButton"),
        bValid = true,
        sText = "";

      let oModel = this.getView().getModel("range");
      let dLower = oModel.getProperty("/lower");
      let sLower = util.DateFormatter.formatDate(dLower);
      let dUpper = oModel.getProperty("/upper");
      let sUpper = util.DateFormatter.formatDate(dUpper);

      // Check that this date is between our upper and lower limits.
      if (!(this._date(dFrom) >= this._date(dLower) && this._date(dTo) <= this._date(dUpper))) {
        bValid = false;
        sText = "Date range must be between " + sLower + " and " + sUpper + ", inclusive"
      }

      // Appropriate error message
      if (!bValid) {
        if (oControl) {
          oControl.setValueState(sap.ui.core.ValueState.Error);
          oControl.setValueStateText(sText);
        }
        oButton.setEnabled(false);
      } else {
        if (oControl) {
          oControl.setValueState(sap.ui.core.ValueState.Success);
          oControl.setValueStateText("");
        }
        oButton.setEnabled(true);
      }

      // return the state of validity
      return bValid;
    };

    /**
     * Clear the range selection points, and update the range model; this in turn
     * will clear the 'Clear selection' link text, and make the control invisible
     * @param oEvent
     */
    Adjust.prototype.onClearRangePress = function(oEvent) {
      this._deselectAllPoints();
    };

    /**
     * Here we are simply checking how many points are selected, and updating flags
     */
    Adjust.prototype._updateSelectedPoints = function() {
      this.getView().getModel("range").setProperty("/selected", (this._workspaceChart.getSelectedPoints() || []).length);
    };

    /**
     * Increment the selected point count
     */
    Adjust.prototype._incrementSelectedPointCount = function() {
      var mModel = this.getView().getModel("range"),
        iCount = mModel.getProperty("/selected");

      // Increment the counter before the full expression is evaluated
      mModel.setProperty("/selected", ++iCount);
    };

    /**
     * Decrement the selected point count
     */
    Adjust.prototype._decrementSelectedPointCount = function() {
      var mModel = this.getView().getModel("range"),
        iCount = mModel.getProperty("/selected");

      // Decrement the counter before the full expression is evaluated
      mModel.setProperty("/selected", --iCount);
    };

    /**
     * Deselects all points on the adjustments chart, if any.
     */
    Adjust.prototype._deselectAllPoints = function() {
      let mRange = this.getView().getModel("range");

      // deselect all points
      let aPoints = this._oChart.getSelectedPoints() || [];
      jQuery.each(aPoints, function(ix, point) {
        point.select(false /* select? */ , true /* accumulate/ not relevent for deselect */ );
      });

      // Update the model and force binding update.
      mRange.setProperty("/selected", 0);
    };

    Adjust.prototype._calcSelectionLower = function() {
      let oModel = this.getView().getModel("forecast");
      let dTo = oModel.getProperty("/Runs('" + this._sRunId + "')/Forecast/train_to");
      return new Date(dTo.setDate(dTo.getDate() + 1));
    };

    Adjust.prototype._calcSelectionMid = function() {
      let oModel = this.getView().getModel("forecast");
      return oModel.getProperty("/Runs('" + this._sRunId + "')/Forecast/train_to");
    };

    Adjust.prototype._calcSelectionUpper = function() {
      let oModel = this.getView().getModel("forecast");
      let dTo = oModel.getProperty("/Runs('" + this._sRunId + "')/Forecast/train_to");
      let iHorizon = oModel.getProperty("/Runs('" + this._sRunId + "')/Forecast/horizon");
      return new Date(dTo.setDate(dTo.getDate() + (iHorizon - 1)));
    };

    /***
     *    ███████╗██╗     ██╗██████╗ ███████╗██████╗
     *    ██╔════╝██║     ██║██╔══██╗██╔════╝██╔══██╗
     *    ███████╗██║     ██║██║  ██║█████╗  ██████╔╝
     *    ╚════██║██║     ██║██║  ██║██╔══╝  ██╔══██╗
     *    ███████║███████╗██║██████╔╝███████╗██║  ██║
     *    ╚══════╝╚══════╝╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
     *
     */

    /**
     * Gets all selected points in the chart, for the adjustable chart line.
     * The original y value is also stored in the point as y1
     * @return {array} Points array
     */
    Adjust.prototype._getSelectedPoints = function() {
      let j = 0;

      // we collect the user-selected points, as these will only be on the main plot line
      // for TOTAL
      let aPoints = this._oChart.getSelectedPoints() || [];
      if (aPoints.length === 0) {
        return aPoints;
      }

      // Give each point it's original value as y1, so that we can reliably
      // and easily undo this change.
      aPoints.forEach(function(point, i) {
        point.update({
          y1: point.y
        });
      }, this);

      return aPoints;
    };

    /**
     * On livechange of the slider, we are updating the associated input. We don't
     * change the chart until sliding is done. This should really be throttled.
     * @param {Event} oEvent Slide event
     */
    Adjust.prototype.onSliderLiveChange = function(oEvent) {
      let oInput = sap.ui.core.Fragment.byId("idSeriesGainFragment", "idSliderInput");
      oInput.setValue(oEvent.getParameter("value").toFixed(3));
    };

    /**
     * Handles change of the slider (once the user has finished their actions);
     * once the user has finished dragging, the series data set will be updated
     * and the series redrawn
     * @param {Event} oEvent Slide changed event
     */
    Adjust.prototype.onSliderChange = function(oEvent) {
      // Get the change value (%); it is safe to simply take this from
      // the event, as the value fromthe slider is always a float
      let fPercent = parseFloat(oEvent.getParameter("value")) / 100;

      // Now make the change to our chart...
      this._update(fPercent, this._aPoints, this._oChart);
    };

    /**
     * Here, we are handling changes to the text input associated with the slider. The
     * slider and this text input work in tandem - a change to one, changes the other.
     * @param oEvent
     */
    Adjust.prototype.onSliderInputChange = function(oEvent) {
      let oInput = oEvent.getSource();
      let sState = oInput.getValueState();
      let fPercent = parseFloat(oEvent.getParameter("value"));

      // Note, the sValue should be a float value; that's all the user is allowed to enter.
      // if it's note, then invalidate the control
      if (isNaN(fPercent)) {
        oInput.setValueState(sap.ui.core.ValueState.Error);
        return;
      }

      // If the input was in error state, clear that and set to None
      if (sState === sap.ui.core.ValueState.Error) {
        oInput.setValueState(sap.ui.core.ValueState.None);
      }

      // Now we set the value of the slider
      let oSlider = sap.ui.core.Fragment.byId("idSeriesGainFragment", "idSlider");
      oSlider.setValue(fPercent);

      // And now do the update
      // Now make the change to our chart...
      this._update(fPercent, this._aPoints, this._oChart);
    };

    /**
     * This is our generic function to update points of a chart, by a given percentage, thus
     * there are three input parameters
     * @param fDecimal Percentage change (-/+) in decimal notation (i.e. -1 to 1)
     * @param aPoints The points to update
     * @param oChart The chart to update
     */
    Adjust.prototype._update = function(fDecimal, aPoints, oChart) {

      // loop through the point collections and update points
      this._aPoints.forEach(function(point, i) {
        // for each point, update the y value by our percentage amount
        point.update({
          // new y value (using y1 as our base)
          y: point.y1 * (1 + fDecimal)
        }, /*redraw = */ false, /* animation = */ true);
      }, this);

      // Update the chart
      oChart.redraw();
    };

    /**
     * Here we want to, based on the range of values in each of the series, determine a suitable
     * factor for the percentage change. If the range of data is from 4M to 8M, then event a small change
     * (e.g. 1%), means altering a point by 40,000 units
     * @param iPercent the actual percentage change (-100 to 100)
     * @param iDilution the factor to dilute the change
     */
    Adjust.prototype._dilutePercent = function(iPercent, iDilution) {

      // if there is no dilution, then the dilution factor is 1
      iDilution = (iDilution || 1);

      // now perform dilution
      return (iPercent / iDilution);
    };

    /**
     * The user has completed their changes, the chart has already been updated, so we need
     * to send the changes to the back-end and update data.
     * @param {Event} oEvent Button press event
     */
    Adjust.prototype.onSliderDone = function(oEvent) {

      // base path
      let oModel = this.getView().getModel("forecast");
      let that = this;
      let sBasePath = "/ForecastData(run_id='" + this._sRunId + "',date=datetime'&1')";
      let dFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
        pattern: "yyyy-MM-ddTHH:mm:ss",
        //UTC : true
      });

      // update backend, using our points collection; note, because this is potentially for
      this._aPoints.forEach(function(point, index) {
        // The x (date value) from the point is an integer representing milliseconds
        // since Epoch. We need a nice date variable for oData.
        let sPath = sBasePath.replace("&1", dFormat.format(new Date(point.x)));
        // create and add the batch operation
        this._aBatchOps.push(oModel.createBatchOperation(sPath, "MERGE", {
          adjustment: point.y
        }));
      }, this);

      // Start the update timer.
      this._startBatchTimer(200);

      // call the close function
      this.closeGain();
    };

    /**
     * Handles cancellation of the Slider control popup
     */
    Adjust.prototype.onSliderCancel = function(oEvent) {

      // loop through the point collections and update points
      this._aPoints.forEach(function(point, i) {
        // for each point, update the y value by our percentage amount
        point.update({
          y: point.y1
        }, /*redraw = */ false, /* animation = */ true);
      }, this);

      // Update the chart
      this._oChart.redraw();

      // call the close function
      this.closeGain();
    };

    /**
     * Close the gain popover and reset.
     */
    Adjust.prototype.closeGain = function() {

      // Close the popover
      if (this._oGainPopover) {
        this._oGainPopover.close();
      }

      // Reset our point collections
      this._aPoints = [];
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
     * Reads the adjustable series from the Highcharts series collection
     * @return {[type]} [description]
     */
    Adjust.prototype._getAdjustableSeries = function() {
      var oSeries = null;

      jQuery.each(this._oChart.series, function(ix, series) {
        if (series.options.ppo.adjustable) {
          oSeries = series;
          // Break loop
          return false;
        }
      });

      // return series
      return oSeries;
    };

    /**
     * Starts a timer (if not already running) that commits batch operations after x seconds
     * @param iDuration milliseconds
     */
    Adjust.prototype._startBatchTimer = function(iDuration) {

      // If timer is already running, or we have no ops, don't run again
      if (this._timerRunning || this._aBatchOps.length === 0) {
        return;
      }

      // otherwise, start the timer.
      this._timerRunning = true;
      let that = this;
      let oBusy = this.getView().byId("idWorkspaceBusyIndicator");
      let oDone = this.getView().byId("idDoneButton");

      // Busy indicator is now busy!
      oBusy.setVisible(this._timerRunning);
      oDone.setEnabled(!this._timerRunning);

      // and run the delayed update
      jQuery.sap.delayedCall(iDuration, this, function() {

        // collect model so we can update
        let oModel = that.getView().getModel("forecast");

        // add batch ops.
        oModel.addBatchChangeOperations(that._aBatchOps);

        // submit batch
        oModel.submitBatch(function(oData, oResponse, aErrorResponses) {
            // Publish an event indicating the workspace was updated; any listeners
            // need to dump their data and refresh
            that.getEventBus().publish("Adjustments", "Refresh");

            // Message
            sap.m.MessageToast.show("Adjustments saved!");

            // empty the batch changes (this is apparently quite fast)
            while (that._aBatchOps.length > 0) {
              that._aBatchOps.pop();
            }

            that._timerRunning = false;
            oBusy.setVisible(that._timerRunning);
            oDone.setEnabled(!that._timerRunning);
          },
          function(oError) {
            sap.m.MessageToast.show("Failed to save adjustments");

            that._timerRunning = false;
            oBusy.setVisible(that._timerRunning);
            oDone.setEnabled(!that._timerRunning);
          },
          true, // async?
          true // Import data?
        );
      }, []);
    };

    /***
     *    ██╗   ██╗██╗███████╗
     *    ██║   ██║██║╚══███╔╝
     *    ██║   ██║██║  ███╔╝
     *    ╚██╗ ██╔╝██║ ███╔╝
     *     ╚████╔╝ ██║███████╗
     *      ╚═══╝  ╚═╝╚══════╝
     *
     */

    /**
     * Set up the forecast viz page (if necessary); For viz, we need to Bind
     * the chart control to the forecast data set for the latest run,
     * and the forecast Id. In this way, we'll get a listing of the data.
     * @param {boolean} bRefresh Force reload of the chart
     */
    Adjust.prototype._maybeDrawViz = function(bRefresh) {

      // require Highcharts.
      jQuery.sap.require("thirdparty.highcharts.Highcharts");

      // Before viz loads, collect all necessary data
      if (this._oChart && !bRefresh) {
        return;
      }

      // Busy!
      this.showBusyDialog();

      // Collect the forecast model.
      let oModel = this.getView().getModel("forecast");

      // Right, now we can begin. The first thing we need, is our data.
      oModel.read("/ForecastDataExtra", {
        urlParameters: {
          $select: "date,forecast,adjustment"
        },
        filters: [new sap.ui.model.Filter({
          path: "run_id",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: this._sRunId
        }), new sap.ui.model.Filter({
          path: "date",
          operator: sap.ui.model.FilterOperator.GT,
          value1: this.getView().getModel("range").getProperty("/lower")
        })],
        sorter: [new sap.ui.model.Sorter({
          path: "date",
          descending: false
        })],
        success: jQuery.proxy(function(oData, mResponse) {
          // With a success response, we can spin through the results
          // and prepare the 2D data array for highcharts
          this._drawViz(oData.results, this.getView().byId("idVizContainer").$()[0]);
          this.hideBusyDialog();
        }, this),
        error: jQuery.proxy(function(mError) {
          this.hideBusyDialog();
        }, this)
      });
    };

    /**
     * Draws a Highcharts viz into the Div.
     * @param  {[type]} aData    [description]
     * @param  {[type]} jDiv     [description]
     */
    Adjust.prototype._drawViz = function(aResults, jDiv) {
      let iHeight = 0;
      let oPromise = jQuery.Deferred();

      // When oPromise resolves, draw the chart.
      jQuery.when(oPromise).then(jQuery.proxy(function() {

        // and render the chart
        this._oChart = new Highcharts.Chart({
          chart: {
            id: "idForecastViz",
            backgroundColor: "none",
            renderTo: jDiv,
            style: {
              fontFamily: ["Arial", "Helvetica", "sans-serif"]
            },
            panKey: "shift",
            panning: true,
            zoomType: "x"
          },
          credits: {
            enabled: true,
            href: "http://forefrontanalytics.com.au",
            text: "Forefront Analytics"
          },
          exporting: {
            enabled: true
          },
          navigation: {
            buttonOptions: {
              enabled: false
            }
          },
          plotOptions: {
            type: "line",
            animation: true,
            stickyTracking: false,
            pointInterval: 86400000,
            zIndex: 100
          },
          series: this._prepareSeries(aResults),
          title: {
            text: "Chart title",
          },
          tooltip: {
            headerFormat: '<span style="font-size: 10px">{point.key:%A, %b %e}</span><br/>',
            pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y:,.0f}</b><br/>',
            valueDecimals: 0,
            delayForDisplay: 500 // TooltipDelay plugin, modified by yours truly
          },
          xAxis: {
            id: "idXaxis",
            type: "datetime",
            dateTimeLabelFormats: {
              day: "%b %e, '%y",
              month: '%b "%y'
            },
            title: {
              align: "middle",
              enabled: true,
              text: "Date"
            }
          },
          yAxis: {
            type: "linear",
            title: {
              align: "middle",
              enabled: true,
              text: "Y axis label"
            }
          }
        });
      }, this));

      // Importantly, we cannot (and should not) draw anything until the
      // div element has it's height set. So let's wait
      let sCallId = jQuery.sap.intervalCall(500, this, function() {
        iHeight = (jDiv ? jQuery(jDiv).height() : 0);

        // Now, if we have a height (and an element), it's okay to continue
        if (iHeight > 0) {
          oPromise.resolve();
          jQuery.sap.clearIntervalCall(sCallId);
        }
      }, []);
    };

    /**
     * Prepares the two series that will be displayed on the chart. This data
     * is built from the oData request results, which are passed directly into
     * this function
     * @param  {Array} aResults The oData results array
     * @return {Array}          Prepared series objects, in an array
     */
    Adjust.prototype._prepareSeries = function(aResults) {

      let self = this;
      let aAdjustment = {
        id: "idAdjustmentSeries",
        color: "#2589BD",
        data: [],
        name: "Adjustments",
        zIndex: 100,
        allowPointSelect: true,
        multiPointDrag: true,
        lineWidth: 3,
        cursor: "pointer",
        ppo: {
          adjustable: true
        },
        // Handling for Point selection on a touch device. In this case, when we're in edit mode,
        // and the user is working with a selectable/adjustable series, then every click should
        // be an accumulative click.
        point: {
          events: {
            click: function(e) {
              if (sap.ui.Device.support.touch) {
                // if touch device, then accumulate all point clicks/touches
                if (this.selected) {
                  this.select(false, true);
                } else {
                  this.select(true, true);
                }
                e.preventDefault();
              }
            },
            select: function(e) {
              self._incrementSelectedPointCount();
            },
            unselect: function(e) {
              self._decrementSelectedPointCount();
            }
          }
        }
      };

      let aForecast = {
        id: "idForecastSeries",
        color: "#03CEA4",
        data: [],
        name: "Forecast figures",
        zIndex: 50,
        ppo: {
          adjustable: false
        },
      };

      // prepare two series...
      aResults.forEach(function(obj, index) {

        // Push on the x and y
        let date = "";
        let forecast = 0;
        let adjustment = 0;

        // If x is of type Date, then parse to milliseconds
        // parse a useful value
        if (obj.date instanceof Date) {
          date = Date.parse(obj.date);
        }

        // Similarly, string number values are of no use; parse a number
        if (typeof obj.forecast === "string") {
          // If we have a decimal point, parse a float,
          if (obj.forecast.indexOf(".") > -1) {
            forecast = parseFloat(obj.forecast);
          } else {
            // otherwise, an Integer is fine
            forecast = parseInt(obj.forecast);
          }
        } else {
          forecast = obj.forecast;
        }
        // Add to data array
        aForecast.data.push([date, forecast]);

        // Similarly, string number values are of no use; parse a number
        if (typeof obj.adjustment === "string") {
          // If we have a decimal point, parse a float,
          if (obj.adjustment.indexOf(".") > -1) {
            adjustment = parseFloat(obj.adjustment);
          } else {
            // otherwise, an Integer is fine
            adjustment = parseInt(obj.adjustment);
          }
        } else {
          adjustment = obj.adjustment;
        }
        // Add to data array
        if (adjustment !== 0) {
          aAdjustment.data.push([date, adjustment]);
        }
      }, this);

      // return our two series!
      return [aForecast, aAdjustment];
    };

    return Adjust;

  }, /* bExport= */ true);
