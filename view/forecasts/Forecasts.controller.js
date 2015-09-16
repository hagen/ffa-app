jQuery.sap.declare("view.forecasts.Forecasts");
jQuery.sap.require("util.DateFormatter");
jQuery.sap.require("util.FloatFormatter");

// Provides controller forecasts.Forecasts
sap.ui.define(["jquery.sap.global", "view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Forecasts = Controller.extend("view.forecasts.Forecasts", /** @lends view.forecasts.Forecasts.prototype */ {
      _sForecastId: "",
      _sFolderId: "",
      _sRunId: "",
      _sReturnRoute: "",
      _sTab: "",
      _navByButton: false
    });

    /**
     * On init handler
     */
    Forecasts.prototype.onInit = function() {

      // register to re-run refresh
      this.getEventBus().subscribe("Rerun", "Complete", this._rebind, this);
      this.getEventBus().subscribe("Adjustments", "Refresh", this._rebind, this);

      // Route handlers
      this.getRouter().getRoute("forecast-from-folder").attachPatternMatched(this._onRouteMatchedFolder, this);
      this.getRouter().getRoute("forecast-from-recents").attachPatternMatched(this._onRouteMatchedRecents, this);
      this.getRouter().getRoute("forecast-from-favorites").attachPatternMatched(this._onRouteMatchedFavorites, this);

      // and if some how they got here directly from the workbench, send them back to the folder
      this.getRouter().getRoute("forecasts").attachPatternMatched(this._onRouteMatchedDefault, this);
    };

    /**
     *
     */
    Forecasts.prototype.onExit = function() {};

    /**
     * Before rendering, we will attempt to identify the most recent Run ID.
     * this is kinda important, because without the Forecast and Run Id, we cannot
     * identify the forecast data set
     */
    Forecasts.prototype.onBeforeRendering = function() {
      // bind to table load event, so we can collect the most recent run.
      var oList = this.getView().byId("idForecastRunList");
      oList.attachEvent("updateFinished", jQuery.proxy(function(oEvent) {
        // right, table has finished loading. We need the first item, if any,
        // and then we need to collect it's run ID
        var oItem = undefined;
        try {
          oItem = oList.getItems()[0];
        } catch (e) {
          oItem = undefined;
        }

        // If we found an item, then we can use it
        if (oItem) {
          this._sRunId = oItem.getBindingContext("forecast").getProperty("id");
          if (this._oRunsLoadedPromise) {
            this._oRunsLoadedPromise.resolve();
          }
        }
      }, this));
    };

    /**
     *
     */
    Forecasts.prototype.onAfterRendering = function() {};

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
     * We've come from the folders overview. So when they nav back, navback
     * there.
     * @param  {object} oEvent Route matched event
     */
    Forecasts.prototype._onRouteMatchedFolder = function(oEvent) {
      this._sReturnRoute = "folders";
      this._onRouteMatched(oEvent);
    };

    /**
     * We've come from the recents overview. So when they nav back, navback
     * there.
     * @param  {object} oEvent Route matched event
     */
    Forecasts.prototype._onRouteMatchedRecents = function(oEvent) {
      this._sReturnRoute = "recents";
      this._onRouteMatched(oEvent);
    };

    /**
     * We've come from the favourites overview. So when they nav back, navback
     * there.
     * @param  {object} oEvent Route matched event
     */
    Forecasts.prototype._onRouteMatchedFavorites = function(oEvent) {
      this._sReturnRoute = "favorites";
      this._onRouteMatched(oEvent);
    };

    /**
     * Some how, they got to the forecast page by bypassing the the previous
     * order of navigation at the workbench. If this is the case, then they
     * are going back to the folder
     * @param  {object} oEvent Route matched event
     */
    Forecasts.prototype._onRouteMatchedDefault = function(oEvent) {
      this._sReturnRoute = "folders";
      this._onRouteMatched(oEvent);
    };

    /**
     * When a route is matched, we always need the forecast ID; all of
     * the preceding route handlers will use this function.
     * @param  {object} oEvent Route matched event
     */
    Forecasts.prototype._onRouteMatched = function(oEvent) {
      this._checkMetaDataLoaded("forecast");

      // We are heavily Dependent on the Run Id, so we'll declare this promise
      // each time the route is matched, but only if it doesn't already exist. It is
      // therefore important to make sure the promise is destroyed when we leave this view.
      if (!this._oRunsLoadedPromise) {
        this._oRunsLoadedPromise = jQuery.Deferred();
      }

      var oParameters = oEvent.getParameters();
      this._sForecastId = oParameters.arguments.forecast_id;
      this._sRoute = oParameters.name;

      // and we also need the Run Id. This can be supplied in the route, but
      // if it isn't then we need to identify the latest run ID, with a query.
      if (oParameters.arguments.run_id) {
        this._sRunId = oParameters.arguments.run_id;
      } else {
        this._asyncGetLatestRun(this._oRunsLoadedPromise);
      }

      // Bind Carousel/page
      this.getView().byId("idForecastCarouselPage").bindElement("forecast>/Forecasts('" + this._sForecastId + "')");

      // If we've already been to this page, then a tab should be set
      // and if we haven't specified a new tab in the route, use the existing;
      // otherwise if there's no previous route and no new route, go to overview,
      // else go to route tab.
      if (this._sTab === "" && !oParameters.arguments.tab) {
        // Default tab
        this._sTab = "overview";
      } else if (oParameters.arguments.tab) {
        // Use the supplied route tab
        this._sTab = oParameters.arguments.tab;
      } else {
        // we need to route to the tab we already have
        this._routeToTab(this._sRoute, this._sForecastId, this._sTab);
      }

      // Update the segmented button and the Carousel (if necessary)
      this._syncToRoute(this._sRoute, this._sForecastId, this._sTab);

      // Reset our button nav flag
      if (this._navByButton) {
        this._navByButton = false;
      }
    };

    /**
     * When the page is changed, through swipe or right/left nav click,
     * we change the route.
     * @param  {string} sRoute        Route
     * @param  {string} sForecastId   Forecast Id
     * @param  {string} sTab          Tab to select
     */
    Forecasts.prototype._routeToTab = function(sRoute, sForecastId, sTab) {

      // nav to the tab.
      this.getRouter().navTo(sRoute, {
        forecast_id: sForecastId,
        tab: sTab
      }, !sap.ui.Device.system.phone);
    };

    /**
     * When a route is matched, the segmented button and carousel active page
     * may need to change. This function does that
     * @param  {string} sRoute        Route
     * @param  {string} sForecastId   Forecast Id
     * @param  {string} sTab          Tab to select
     */
    Forecasts.prototype._syncToRoute = function(sRoute, sForecastId, sTab) {

      // This is the ID of the new button, to be selected.
      var sInflectedTab = sTab.charAt(0).toUpperCase() + sTab.slice(1);
      var sButtonToSelectId = "idCarousel" + sInflectedTab + "Button";
      var sNewPageId = "idCarousel" + sInflectedTab + "Page";

      // Get segmented button, so we can determine what is currently selected.
      var oSegmentedButton = this.getView().byId("idForecastSegmentedButton");

      // This call returns the button Id, not the button.
      var sButtonId = oSegmentedButton.getSelectedButton();
      if (!sButtonId) {
        oSegmentedButton.setSelectedButton(this.getView().byId(sButtonToSelectId));
      } else if (sButtonId.indexOf(sButtonToSelectId) === -1) {
        oSegmentedButton.setSelectedButton(this.getView().byId(sButtonToSelectId));
      }

      // And now for the Carousel...
      var oCarousel = this.getView().byId("idForecastCarousel");
      var oNewPage = this.getView().byId(sNewPageId);

      // what page index are we at?
      // Because the Carousel doesn't return page objects, only view-based Ids
      // (e.g. __xmlview1--idOfPage), we need to split at "--" to get the actual
      // control id, then we can determine the page id
      var sCurrentPage = oCarousel.getActivePage();

      // If we have no current page, then set the active page,
      if (!sCurrentPage) {
        oCarousel.setActivePage(oNewPage);
      } else {
        // navigate to the correct page
        var iFrom = oCarousel.indexOfPage(this.getView().byId(oCarousel.getActivePage().split("--")[1]));
        var iTo = oCarousel.indexOfPage(oNewPage);
        var i = (iTo - iFrom);

        // Transition forwards
        if (i > 0) {
          for (i; i > 0; i--) {
            oCarousel.next();
          }
        } else if (i < 0) {
          // Go backwards
          for (i; i < 0; i++) {
            oCarousel.previous();
          }
        }
        // for zero, do nothing
      }

      // And then call the tab's set up page...
      try {
        this["setup" + sInflectedTab + "Page"].apply(this, [])
      } catch (e) {
        // Couldn't call the tab's setup function
        alert(e.message);
      }
    };

    /***
     *    ██████╗  █████╗  ██████╗ ███████╗    ██████╗ ██╗███╗   ██╗██████╗
     *    ██╔══██╗██╔══██╗██╔════╝ ██╔════╝    ██╔══██╗██║████╗  ██║██╔══██╗
     *    ██████╔╝███████║██║  ███╗█████╗      ██████╔╝██║██╔██╗ ██║██║  ██║
     *    ██╔═══╝ ██╔══██║██║   ██║██╔══╝      ██╔══██╗██║██║╚██╗██║██║  ██║
     *    ██║     ██║  ██║╚██████╔╝███████╗    ██████╔╝██║██║ ╚████║██████╔╝
     *    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚═════╝ ╚═╝╚═╝  ╚═══╝╚═════╝
     *
     */

    Forecasts.prototype._rebind = function() {
      // If there's a chart, destory it.
      if (this._oChart) {
        this._oChart.destroy();
        this._oChart = undefined;
      }

      // and the table...
      var oTable = this.getView().byId("idForecastDataTable");
      var oBinding = oTable.getBinding("items");
      if (oBinding) {
        oBinding.refresh();
      }
    };

    /***
     *    ██████╗  █████╗ ████████╗ █████╗ ███████╗███████╗████████╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝
     *    ██║  ██║███████║   ██║   ███████║███████╗█████╗     ██║
     *    ██║  ██║██╔══██║   ██║   ██╔══██║╚════██║██╔══╝     ██║
     *    ██████╔╝██║  ██║   ██║   ██║  ██║███████║███████╗   ██║
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝
     *
     */

    /**
     * Set up the data set page (if necessary)
     * @return {[type]} [description]
     */
    Forecasts.prototype.setupDatasetPage = function() {

    };

    /***
     *     ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗██╗███████╗██╗    ██╗
     *    ██╔═══██╗██║   ██║██╔════╝██╔══██╗██║   ██║██║██╔════╝██║    ██║
     *    ██║   ██║██║   ██║█████╗  ██████╔╝██║   ██║██║█████╗  ██║ █╗ ██║
     *    ██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗╚██╗ ██╔╝██║██╔══╝  ██║███╗██║
     *    ╚██████╔╝ ╚████╔╝ ███████╗██║  ██║ ╚████╔╝ ██║███████╗╚███╔███╔╝
     *     ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝
     *
     */

    /**
     * Set up the forecast overview page (if necessary)
     * @return {[type]} [description]
     */
    Forecasts.prototype.setupOverviewPage = function() {
      // We cannot do anything without a Run ID. So wait until that is loaded.
      var self = this;
      jQuery.when(this._oRunsLoadedPromise).then(function() {
        // now we bind the object statuses to our latest run
        var sPath = "forecast>/Runs('" + self._sRunId + "')/";

        // Bind the median
        self.getView().byId("idMedianApeObjectStatus").bindProperty("text", {
          path : sPath + "median_ape",
          type: new sap.ui.model.type.Float(),
          formatter : util.FloatFormatter.formatMAPEPercent
        });

        // Bind the Mean
        self.getView().byId("idMeanApeObjectStatus").bindProperty("text", {
          path : sPath + "mean_ape",
          type: new sap.ui.model.type.Float(),
          formatter : util.FloatFormatter.formatMAPEPercent
        });
      });
    };

    /**
     * When the run list item is pressed, we show a pop up with information
     * about the run
     * @param  {object} oEvent List item press event
     */
    Forecasts.prototype.onRunListItemPress = function(oEvent) {
      // Busy...
      // this.showBusyDialog({});

      // Create the dialog fragment, if not already init'd
      if (!this._oDiagnosticsDialog) {
        this._oDiagnosticsDialog = sap.ui.xmlfragment("idDiagnosticsFragment", "view.forecasts.Diagnostics", this);
        this.getView().addDependent(this._oDiagnosticsDialog);
      }

      // What the list item's binding context run id?
      var oItem = oEvent.getParameter("listItem");
      var oContext = oItem.getBindingContext("forecast");
      var sId = oContext.getProperty("id");

      // Attach to data received
      // this._oDiagnosticsDialog.attachEvent("dataReceived", jQuery.proxy(function() {
      //
      //   // Hide busy dialog
      //   this.hideBusyDialog();
      //   // Open
      //   this._oDiagnosticsDialog.open();
      // }, this));

      // bind the dailog to the Diagnostics for this run.
      this._oDiagnosticsDialog.bindElement({
        path: "forecast>/Diagnostics('" + sId + "')",
        expand: 'Run,Run/Forecast'
      });

      // Open
      this._oDiagnosticsDialog.open();
    };

    /**
     * [onDiagnosticsClosePress description]
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Forecasts.prototype.onDiagnosticsClosePress = function(oEvent) {
      // When the button is pressed, close the dialog.
      this._oDiagnosticsDialog.close();
    };

    /***
     *    ██████╗ ███████╗    ██████╗ ██╗   ██╗███╗   ██╗
     *    ██╔══██╗██╔════╝    ██╔══██╗██║   ██║████╗  ██║
     *    ██████╔╝█████╗      ██████╔╝██║   ██║██╔██╗ ██║
     *    ██╔══██╗██╔══╝      ██╔══██╗██║   ██║██║╚██╗██║
     *    ██║  ██║███████╗    ██║  ██║╚██████╔╝██║ ╚████║
     *    ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    /**
     * Re-runs an already executed forecast. This is just a trigger to display
     * the re-run pop-up however, which is a simple dialog with some validation
     * components
     * @param  {Event} oEvent Button press event
     */
    Forecasts.prototype.onReRunPress = function(oEvent) {

      // Nav to the re-run view
      this.getRouter().navTo("rerun", {
        forecast_id: this._sForecastId,
        return_route: this._sRoute
      }, !sap.ui.Device.system.phone);
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
    Forecasts.prototype.setupVizPage = function(bRefresh) {
      // require Highcharts.
      jQuery.sap.require("thirdparty.highcharts.Highcharts");

      // Before viz loads, collect all necessary data
      if (this._oChart && !bRefresh) {
        return;
      }

      // Busy!
      this.showBusyDialog();

      // Collect the forecast model.
      var oModel = this.getView().getModel("forecast");

      // We cannot do anything without a Run ID. So wait until that is loaded.
      jQuery.when(this._oRunsLoadedPromise).then(jQuery.proxy(function() {

        // Right, now we can begin. The first thing we need, is our data.
        oModel.read("/ForecastDataExtra", {
          urlParameters: {
            $select: "date,forecast,actual,adjustment"
          },
          filters: [new sap.ui.model.Filter({
            path: "run_id",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: this._sRunId
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
      }, this));
    };

    /**
     * Draws a Highcharts viz into the Div.
     * @param  {[type]} aData    [description]
     * @param  {[type]} jDiv     [description]
     */
    Forecasts.prototype._drawViz = function(aResults, jDiv) {
      var iHeight = 0;
      var oPromise = jQuery.Deferred();

      // Prepare the data into two series.
      var aData = [];

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
      var sCallId = jQuery.sap.intervalCall(500, this, function() {
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
    Forecasts.prototype._prepareSeries = function(aResults) {

      var self = this;
      var aActual = {
        id: "idActualSeries",
        color: "#A23B72",
        data: [],
        name: "Actual figures",
        zIndex: 50
      };

      var aForecast = {
        id: "idForecastSeries",
        color: "#03CEA4",
        data: [],
        name: "Forecast figures",
        zIndex: 100
      };

      var aAdjustment = {
        id: "idAdjustmentSeries",
        color: "#2589BD",
        data: [],
        name: "Adjustments",
        zIndex: 10
      };

      // prepare two series...
      aResults.forEach(function(obj, index) {

        // Push on the x and y
        var date = "";
        var actual = 0;
        var forecast = 0;
        var adjustment = 0;

        // If x is of type Date, then parse to milliseconds
        // parse a useful value
        if (obj.date instanceof Date) {
          date = Date.parse(obj.date);
        }

        // Similarly, string number values are of no use; parse a number
        if (typeof obj.actual === "string") {
          // If we have a decimal point, parse a float,
          if (obj.actual.indexOf(".") > -1) {
            actual = parseFloat(obj.actual);
          } else {
            // otherwise, an Integer is fine
            actual = parseInt(obj.actual);
          }
        } else {
          actual = obj.actual;
        }
        // Add to data array
        if (actual !== 0) {
          aActual.data.push([date, actual]);
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
      return [aActual, aForecast, aAdjustment];
    };

    /***
     *    ████████╗ █████╗ ██████╗ ██╗     ███████╗
     *    ╚══██╔══╝██╔══██╗██╔══██╗██║     ██╔════╝
     *       ██║   ███████║██████╔╝██║     █████╗
     *       ██║   ██╔══██║██╔══██╗██║     ██╔══╝
     *       ██║   ██║  ██║██████╔╝███████╗███████╗
     *       ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝
     *
     */

    /**
     * Set up the forecast data table page (if necessary)
     * @return {[type]} [description]
     */
    Forecasts.prototype.setupTablePage = function() {
      // Dependent on the run Id being populated, so we'll
      // wait for that.
      jQuery.when(this._oRunsLoadedPromise).then(jQuery.proxy(function() {
        // Bind the table page to the most recent run.
        var oPage = this.getView().byId("idCarouselTablePage");
        oPage.bindElement("forecast>/Runs('" + this._sRunId + "')");
      }, this));
    };

    /***
     *    ██████╗ ██╗   ██╗████████╗████████╗ ██████╗ ███╗   ██╗    ███████╗██╗   ██╗███████╗███╗   ██╗████████╗███████╗
     *    ██╔══██╗██║   ██║╚══██╔══╝╚══██╔══╝██╔═══██╗████╗  ██║    ██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
     *    ██████╔╝██║   ██║   ██║      ██║   ██║   ██║██╔██╗ ██║    █████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
     *    ██╔══██╗██║   ██║   ██║      ██║   ██║   ██║██║╚██╗██║    ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ╚════██║
     *    ██████╔╝╚██████╔╝   ██║      ██║   ╚██████╔╝██║ ╚████║    ███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║   ███████║
     *    ╚═════╝  ╚═════╝    ╚═╝      ╚═╝    ╚═════╝ ╚═╝  ╚═══╝    ╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * User hits navback, and we need to decide, based on how they arrived here,
     * where to return them to. Luckily, when a route is matched, the return
     * route is kept.
     * @param  {object} oEvent Button press event
     */
    Forecasts.prototype.onNavBackPress = function(oEvent) {
      // Depending on how they arrived here, we send them back via a
      // different route (this function is defined in the super)
      var sFolderId = this.getForecast(this._sForecastId).folder_id;

      // and back we go!
      this.getRouter().navTo(this._sReturnRoute, {
        folder_id: sFolderId
      }, !sap.ui.Device.system.phone);

      // Reset
      this._reset();
    };

    /**
     * When the segmeented button is fired, this tells us which button was
     * pressed.
     * @param  {object} oEvent Button press event
     */
    Forecasts.prototype.onSegmentedButtonSelect = function(oEvent) {

      // Button (inside segmented button) that fired the event
      var oButton = oEvent.getParameter("button");

      // grab the custom data key, 'tab'
      var sTab = oButton.data("tab");

      // We need a global flag to tell the Carousel not to handle page sliding.
      this._navByButton = true;

      // On tab change, fire generic handler
      this._routeToTab(this._sRoute, this._sForecastId, sTab);
    };

    /**
     * When the page is changed, through swipe or right/left nav click,
     * we change the route. The Carousel is not programmed very well however,
     * and there is a mismatch between previous/next and onPageChanged events.
     * If you call previous/next, the new page in on PageChanged is reported
     * incorrectly.
     * @param  {object} oEvent Page changed event
     */
    Forecasts.prototype.onPageChanged = function(oEvent) {

      // If we are nevigating from the click of a segmented button, do not
      // handle page change events
      if (this._navByButton) {
        return;
      }

      // This is the new page
      var sNewPageId = oEvent.getParameter("newActivePageId");
      var sOldPageId = oEvent.getParameter("oldActivePageId");

      // Handles instances where no tab was provided, and the default
      // overview tab is used.
      if (sNewPageId === sOldPageId) {
        return;
      }

      // Navigate to the appropriate Route
      var sTab = this.getView().byId(sNewPageId).data("tab");

      // On tab change, fire generic handler
      this._routeToTab(this._sRoute, this._sForecastId, sTab);
    };

    /**
     * Favorite button pressed. Toggle on/off.
     * @param  {object} oEvent Button press event
     */
    Forecasts.prototype.onFavoritePress = function(oEvent) {
      var oButton = oEvent.getSource(),
        oModel = this.getView().getModel("forecast");

      // UPdate model and save
      oModel.setProperty("/Forecasts('" + this._sForecastId + "')/favorite", (oButton.getPressed() ? "X" : " "));
      if (oModel.hasPendingChanges()) {
        oModel.submitChanges();
      }
    };

    /**
     * Renders the overflow action sheet, containing the edit and settings
     * buttons.
     * @param  {Event} oEvent The button press event
     */
    Forecasts.prototype.onOverflowPress = function(oEvent) {
      // We're going to show the overflow fragment
      if (!this._oActionSheet) {
        this._oActionSheet = sap.ui.xmlfragment("idActionSheetFragment", "view.forecasts.ActionSheet", this);
        this.getView().addDependent(this._oActionSheet);
      }

      // Now open the action sheet
      this._oActionSheet.openBy(oEvent.getSource());
    };

    /**
     * Shows the chart display options pop-up. This floats over the chart,
     * and offers simple settings like colour, and titles.
     * @param  {event} oEvent The button press event
     */
    Forecasts.prototype.onOptionsPress = function(oEvent) {

    };

    /**
     * Navigates to the workspace for this forecast.
     * @param  {Event} oEvent The button press event
     */
    Forecasts.prototype.onAdjustPress = function(oEvent) {
      this.getRouter().navTo("adjust", {
        forecast_id: this._sForecastId,
        run_id: this._sRunId,
        return_route: this._sRoute
      }, !sap.ui.Device.system.phone);
    };

    /***
     *    ███████╗██████╗ ██╗████████╗    ███╗   ██╗ █████╗ ███╗   ███╗███████╗
     *    ██╔════╝██╔══██╗██║╚══██╔══╝    ████╗  ██║██╔══██╗████╗ ████║██╔════╝
     *    █████╗  ██║  ██║██║   ██║       ██╔██╗ ██║███████║██╔████╔██║█████╗
     *    ██╔══╝  ██║  ██║██║   ██║       ██║╚██╗██║██╔══██║██║╚██╔╝██║██╔══╝
     *    ███████╗██████╔╝██║   ██║       ██║ ╚████║██║  ██║██║ ╚═╝ ██║███████╗
     *    ╚══════╝╚═════╝ ╚═╝   ╚═╝       ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
     *
     */
    /**
     * Allow editing of the forecat name by clicking the title
     */
    Forecasts.prototype.onForecastNamePress = function(oEvent) {
      // create edit name popup only once
      if (!this._editNamePopup) {
        this._editNamePopup = sap.ui.xmlfragment("idForecastNameEditFrag", "view.forecasts.EditForecastNameDialog", this);
        this.getView().addDependent(this._editNamePopup);
      }

      // Collect current name
      var oInput = sap.ui.core.Fragment.byId("idForecastNameEditFrag", "idEditForecastName");
      oInput.setValue(this.getView().getModel("forecast").getProperty("/Forecasts('" + this._sForecastId + "')/name"));

      // Open action sheet
      this._editNamePopup.open();
    };

    /**
     * User is saving the forecast name change. Persist against model.
     * No validation is performed here.
     */
    Forecasts.prototype.onForecastNameSave = function(oEvent) {
      // Collect name as changed by the user...
      var oInput = sap.ui.core.Fragment.byId("idForecastNameEditFrag", "idEditForecastName");
      var sName = oInput.getValue();
      if (sName === "" || sName === null) {
        this.showErrorAlert("Forecast name cannot be blank");
        return;
      }

      // Otherwise persist changes
      var oModel = this.getView().getModel("forecast");
      oModel.setProperty("/Forecasts('" + this._sForecastId + "')/name", sName);
      if (oModel.hasPendingChanges()) { // which it will
        oModel.submitChanges();
      }
      this._editNamePopup.close();
    };

    /**
     * User is cancelling the name change - do not persist changes to model
     */
    Forecasts.prototype.onForecastNameCancel = function(oEvent) {
      this._editNamePopup.close();
    };

    /***
     *    ██████╗ ██╗   ██╗███╗   ██╗███████╗
     *    ██╔══██╗██║   ██║████╗  ██║██╔════╝
     *    ██████╔╝██║   ██║██╔██╗ ██║███████╗
     *    ██╔══██╗██║   ██║██║╚██╗██║╚════██║
     *    ██║  ██║╚██████╔╝██║ ╚████║███████║
     *    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
     *
     */

    /**
     * Tries to load the latest run id, if not already loaded; once loaded, The
     * promise is resloved.
     * @param  {[type]} oPromise [description]
     */
    Forecasts.prototype._asyncGetLatestRun = function(oPromise) {
      if (this._sRunId !== "") {
        oPromise.resolve();
        return;
      }

      // otherwise, load the most recent Runfrom the model.
      this.getView().getModel("forecast").read("/Runs", {
        urlParameters: {
          $top: 1
        },
        filters: [new sap.ui.model.Filter({
          path: "forecast_id",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: this._sForecastId
        })],
        sorters: [new sap.ui.model.Sorter({
          path: "run_at",
          descending: true // newest at the top
        })],
        async: true,
        success: jQuery.proxy(function(oData, mResponse) {
          if (oData.results[0]) {
            this._sRunId = oData.results[0].id;
            oPromise.resolve();
          }
        }, this),
        error: jQuery.proxy(function(mError) {
          this._sRunId = "";
        }, this)
      });
    };

    /***
     *    ███████╗ ██████╗ ██████╗ ███╗   ███╗ █████╗ ████████╗████████╗███████╗██████╗ ███████╗
     *    ██╔════╝██╔═══██╗██╔══██╗████╗ ████║██╔══██╗╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗██╔════╝
     *    █████╗  ██║   ██║██████╔╝██╔████╔██║███████║   ██║      ██║   █████╗  ██████╔╝███████╗
     *    ██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║██╔══██║   ██║      ██║   ██╔══╝  ██╔══██╗╚════██║
     *    ██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║██║  ██║   ██║      ██║   ███████╗██║  ██║███████║
     *    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝
     *
     */

    /**
     * Advances the date by one day.
     * @param  {String} sDate Date to advance
     * @return {String}       New date
     */
    Forecasts.prototype.nextDay = function(sDate) {

      // Need SAP formatter
      jQuery.sap.require("sap.ui.core.format.DateFormat");

      // Gateway Date and Time Values
      var dDate = new Date(sDate);

      // Create the Date Formatter
      var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
        pattern: "dd/MM/yyyy"
      });

      dDate.setDate(dDate.getDate() + 1);
      return dateFormat.format(new Date(dDate.getTime()));
    };

    /***
     *    ███████╗██╗  ██╗██╗████████╗
     *    ██╔════╝╚██╗██╔╝██║╚══██╔══╝
     *    █████╗   ╚███╔╝ ██║   ██║
     *    ██╔══╝   ██╔██╗ ██║   ██║
     *    ███████╗██╔╝ ██╗██║   ██║
     *    ╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝
     *
     */

    /**
     * On exit, reset the page and all global variables
     * @return {[type]} [description]
     */
    Forecasts.prototype._reset = function() {
      this._sForecastId = "";
      this._sFolderId = "";
      this._sRunId = "";

      this._oRunsLoadedPromise.reject();
      delete this._oRunsLoadedPromise;
    };

    return Forecasts;

  }, /* bExport= */ true);
