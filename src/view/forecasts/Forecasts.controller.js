jQuery.sap.declare("com.ffa.hpc.view.forecasts.Forecasts");
jQuery.sap.require("com.ffa.hpc.util.DateFormatter");
jQuery.sap.require("com.ffa.hpc.util.FloatFormatter");

// Provides controller forecasts.Forecasts
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Forecasts = Controller.extend("com.ffa.hpc.view.forecasts.Forecasts", /** @lends com.ffa.hpc.view.forecasts.Forecasts.prototype */ {
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
      this.getRouter().getRoute("forecast-from-search").attachPatternMatched(this._onRouteMatchedSearch, this);

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
     * We've come from the search overview. So when they nav back, navback
     * there.
     * @param  {object} oEvent Route matched event
     */
    Forecasts.prototype._onRouteMatchedSearch = function(oEvent) {
      this._sReturnRoute = "search";
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
          path: sPath + "median_ape",
          type: new sap.ui.model.type.Float(),
          formatter: com.ffa.hpc.util.FloatFormatter.formatMAPEPercent
        });

        // Bind the Mean
        self.getView().byId("idMeanApeObjectStatus").bindProperty("text", {
          path: sPath + "mean_ape",
          type: new sap.ui.model.type.Float(),
          formatter: com.ffa.hpc.util.FloatFormatter.formatMAPEPercent
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
        this._oDiagnosticsDialog = sap.ui.xmlfragment("idDiagnosticsFragment", "com.ffa.hpc.view.forecasts.Diagnostics", this);
        this.getView().addDependent(this._oDiagnosticsDialog);
      }

      // What the list item's binding context run id?
      var oItem = oEvent.getParameter("listItem");
      var oContext = oItem.getBindingContext("forecast");
      var sId = oContext.getProperty("id");

      // bind the dailog to the Diagnostics for this run.
      try {
        this._oDiagnosticsDialog.unbindElement("forecast");
      } catch (e) {

      }

      this._oDiagnosticsDialog.bindElement({
        path: "forecast>/Diagnostics('" + sId + "')",
        parameters: {
          expand: 'Run'
        }
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
      jQuery.sap.require("com.ffa.hpc.thirdparty.highcharts.Highcharts");

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

      // we'll also need to read the Chart Settings for this viz, so they
      // can be incorporated into the chart... through a callback, supply these
      // to the chart build
      this._getChartSettings(this._sRunId,
        jQuery.proxy(function(oSettings) {

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
              series: this._prepareSeries(aResults, oSettings),
              title: {
                text: oSettings.title,
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
                  text: oSettings.xlabel
                }
              },
              yAxis: {
                type: "linear",
                title: {
                  align: "middle",
                  enabled: true,
                  text: oSettings.ylabel
                }
              }
            });
          }, this));
        }, this),
        function() {
          // error
        }
      );

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
     * retreievs the chart display settings for this Run id. Also takes a success
     * and error callback with which the results are passed
     * @param  {String}   sRunId   Run Id to read from
     * @param  {Function} fnSucces Success callback
     * @param  {Function} fnError  Error callback
     */
    Forecasts.prototype._getChartSettings = function (sRunId, fnSucces, fnError) {
      var oModel = this.getView().getModel("viz");
      var sPath = "/Runs('" + sRunId + "')/ChartSettings";

      // does the model have our data?
      var oData = oModel.getObject(sPath);
      if (oData) {
        if (typeof fnSucces === "function") {
          try {
            fnSucces(oData);
          } catch (e) {}
        }
        return;
      } else {
        // Otherwise, we call back end
        oModel.read(sPath, {
          success : function(oData, mResponse) {
            if (typeof fnSucces === "function") {
              try {
                fnSucces(oData);
              } catch (e) {}
            }
          },
          error : jQuery.proxy(function(mError) {
            this._maybeHandleAuthError(mError);
            if (typeof fnError === "function") {
              try {
                fnError(mError);
              } catch (e) {}
            }
          }, this)
        });
      }

    };

    /**
     * Prepares the two series that will be displayed on the chart. This data
     * is built from the oData request results, which are passed directly into
     * this function
     * @param  {Array}  aResults  The oData results array
     * @param  {Object} oSettings The oData chart display settings
     * @return {Array}            Prepared series objects, in an array
     */
    Forecasts.prototype._prepareSeries = function(aResults, oSettings) {

      var self = this;
      var aActual = {
        id: "idActualSeries",
        color: oSettings.actual_colour,
        data: [],
        name: oSettings.actual_title,
        zIndex: 50
      };

      var aForecast = {
        id: "idForecastSeries",
        color: oSettings.forecast_colour,
        data: [],
        name: oSettings.forecast_title,
        zIndex: 100
      };

      var aAdjustment = {
        id: "idAdjustmentSeries",
        color: oSettings.adjustment_colour,
        data: [],
        name: oSettings.adjustment_title,
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
        this._oActionSheet = sap.ui.xmlfragment("idActionSheetFragment", "com.ffa.hpc.view.forecasts.ActionSheet", this);
        this.getView().addDependent(this._oActionSheet);
      }

      // Now open the action sheet
      this._oActionSheet.openBy(oEvent.getSource());
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
     *     ██████╗██╗  ██╗ █████╗ ██████╗ ████████╗    ███████╗███████╗████████╗████████╗██╗███╗   ██╗ ██████╗ ███████╗
     *    ██╔════╝██║  ██║██╔══██╗██╔══██╗╚══██╔══╝    ██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██║████╗  ██║██╔════╝ ██╔════╝
     *    ██║     ███████║███████║██████╔╝   ██║       ███████╗█████╗     ██║      ██║   ██║██╔██╗ ██║██║  ███╗███████╗
     *    ██║     ██╔══██║██╔══██║██╔══██╗   ██║       ╚════██║██╔══╝     ██║      ██║   ██║██║╚██╗██║██║   ██║╚════██║
     *    ╚██████╗██║  ██║██║  ██║██║  ██║   ██║       ███████║███████╗   ██║      ██║   ██║██║ ╚████║╚██████╔╝███████║
     *     ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
     *
     */

    /**
     * Shows the chart display options pop-up. This floats over the chart,
     * and offers simple settings like colour, and titles.
     * @param  {event} oEvent The button press event
     */
    Forecasts.prototype.onDisplaySettingsPress = function(oEvent) {
      // We're going to show the settings dialog.
      if (!this._oSettingsDialog) {
        this._oSettingsDialog = sap.ui.xmlfragment("idChartSettingsFragment", "com.ffa.hpc.view.forecasts.ChartSettings", this);
        this.getView().addDependent(this._oSettingsDialog);
      }

      // make the list Busy
      var oList = sap.ui.core.Fragment.byId("idChartSettingsFragment", "idChartSettingsList");

      // Try and get the dialog binding, if there is one. If the dialog hasn't
      // been displayed yet, then it won't have a binding.
      var sPath = "/Runs('" + this._sRunId + "')";
      var oBinding = this._oSettingsDialog.getElementBinding("viz");
      var bBind = false;
      if (!oBinding) {
        bBind = true;
      } else if (oBinding.getPath() !== sPath) {
        bBind = false;
      }

      // are we binding?
      if (bBind) {
        // we are busy
        oList.setBusy(true);

        // Bind the dialog to the chart settings for this run.
        this._oSettingsDialog.bindElement({
          path : "viz>" + sPath,
          parameters : {
            expand : "ChartSettings"
          }
        });
      }
      // bind to data received
      var oBinding = this._oSettingsDialog.getElementBinding("viz");
      oBinding.attachDataReceived(function() {
        oList.setBusy(false);
      })

      // Now open the settings dialog sheet
      this._oSettingsDialog.open();
    };

    /**
     * Validates and saves the chart display settings
     * @param  {event} oEvent The button press event
     */
    Forecasts.prototype.onDisplaySettingsDonePress = function(oEvent) {

      // Getter
      var get = jQuery.proxy(function(sId) {
        return this.getFragmentControl("idChartSettingsFragment", sId);
      }, this);

      var bValid = true;

      // Execute our validation rules.
      // 1. If chart title is on, then we must have text in Chart title.
      if (get("idTitleSwitch").getState() && !get("idTitleInput").getValue()) {
        get("idTitleInput").setValueState(sap.ui.core.ValueState.Error)
                            .setValueStateText("Empty chart title");
        bValid = false;
      } else {
        get("idTitleInput").setValueState(sap.ui.core.ValueState.None)
                            .setValueStateText("");
      }

      // 2. if axis labels is on, then we must have two axis labels - one for y
      // and one for x
      if (get("idAxisLabelsSwitch").getState()) {
        // check x axis label input.
        if (!get("idXAxisInput").getValue()) {
          get("idXAxisInput").setValueState(sap.ui.core.ValueState.Error)
                              .setValueStateText("Empty x axis label");
          bValid = false;
        } else {
          get("idXAxisInput").setValueState(sap.ui.core.ValueState.None)
                              .setValueStateText("");
        }

        // check y axis label input.
        if (!get("idYAxisInput").getValue()) {
          get("idYAxisInput").setValueState(sap.ui.core.ValueState.Error)
                              .setValueStateText("Empty y axis label");
          bValid = false;
        } else {
          get("idYAxisInput").setValueState(sap.ui.core.ValueState.None)
                              .setValueStateText("");
        }
      }

      // If we're not valid, then you can't close the dialog.
      if (bValid && this._oSettingsDialog) {
        // We're going to show the settings dialog.
        this._oSettingsDialog.close();
      }
    };

    /**
     * When the display title switch is toggled, we need to take some action on
     * this title input field
     * @param  {Event} oEvent The switch event
     */
    Forecasts.prototype.onTitleSwitchChange = function (oEvent) {

      // Getter
      var get = jQuery.proxy(function(sId) {
        return this.getFragmentControl("idChartSettingsFragment", sId);
      }, this);

      // Declare oData payload
      var oData = {
        show_title : ""
      };

      // When the switch is switch off, clear the title input and disable.
      var bState = oEvent.getParameter("state");
      oData.show_title = (bState ? "X" : "");

      // If off, then disable and clear.
      var oInput = get("idTitleInput");
      if (!bState) {
        // clear and disable
        oInput.setValue("")
                .setEnabled(false)
                .setValueState(sap.ui.core.ValueState.None)
                .setValueStateText("");

        // Add to update payload, only if being removed
        oData.title = "";
      } else {
        oInput.setEnabled(true);
      }

      // and do the update...
      var oContext = oEvent.getSource().getBindingContext("viz"),
        oModel = oContext.getModel(),
        sId = oModel.getProperty("ChartSettings/id", oContext);
      oModel.update("/ChartSettings('" + sId +"')", oData, {
        merge : true,
        async : true
      });

      // Update the chart
      this.updateHighcharts(this._oChart, oData);
    };

    /**
     * When the axis labels switch is toggled, we need to take some action on
     * the axis label input fields.
     * @param  {Event} oEvent The switch event
     */
    Forecasts.prototype.onAxisLabelsSwitchChange = function (oEvent) {

      // Getter
      var get = jQuery.proxy(function(sId) {
        return this.getFragmentControl("idChartSettingsFragment", sId);
      }, this);

      // Declare oData payload
      var oData = {
        show_axis_labels : ""
      };

      // When the switch is switch off, clear the title input and disable.
      var bState = oEvent.getParameter("state");
      oData.show_axis_labels = (bState ? "X" : "");

      // If off, then disable and clear. X axis first.
      var oInput = get("idXAxisInput");
      var sValue = oInput.getValue();
      if (!bState) {
        // clear and disable
        oInput.setValue("")
                .setEnabled(false)
                .setValueState(sap.ui.core.ValueState.None)
                .setValueStateText("");

        // Add to update payload, only if being removed
        oData.xlabel = "";
      } else {
        oInput.setEnabled(true);
      }

      // Y axis now!
      oInput = get("idYAxisInput");
      sValue = oInput.getValue();

      // Add to update payload
      oData.ylabel = (bState ? sValue : "");
      if (!bState) {
        // clear and disable
        oInput.setValue("")
                .setEnabled(false)
                .setValueState(sap.ui.core.ValueState.None)
                .setValueStateText("");

        // Add to update payload, only if being removed
        oData.ylabel = "";
      } else {
        oInput.setEnabled(true);
      }

      // and do the update...
      var oContext = oEvent.getSource().getBindingContext("viz"),
        oModel = oContext.getModel(),
        sId = oModel.getProperty("ChartSettings/id", oContext);
      oModel.update("/ChartSettings('" + sId +"')", oData, {
        merge : true,
        async : true
      });

      // Update the chart
      this.updateHighcharts(this._oChart, oData);
    };

    /**
     * Simply handles changes to the input field and checks that there is a
     * value supplied. Sets state accordingly.
     * @param  {Event} oEvent Value change event
     */
    Forecasts.prototype.onChartSettingsInputChange = function (oEvent) {
      // All we need do is check if there is a value, and if so, remove
      // error value and state.
      var sValue = oEvent.getParameter("value"),
        oControl = oEvent.getSource(),
        sName = oControl.getName();

      if (sValue) {
        oControl.setValueState(sap.ui.core.ValueState.None).setValueStateText("");
      }

      // Update the chart
      var oData = {};
      oData[sName] = sValue;

      var oContext = oControl.getBindingContext("viz"),
        oModel = oContext.getModel(),
        sId = oModel.getProperty("ChartSettings/id", oContext);
      oModel.update("/ChartSettings('" + sId +"')", oData, {
        merge : true,
        async : true
      });

      this.updateHighcharts(this._oChart, oData);
    };

    /**
     * Updates the Highcharts object with the supplied parameters, using basic
     * mapping
     * @param  {Highcharts} oChart  Highcharts chart
     * @param  {Object}     oParams Named array
     */
    Forecasts.prototype.updateHighcharts = function (oChart, oParams) {

      // spin through all parameters, and apply the approriate function for each
      for (var key in oParams) {
        if (oParams.hasOwnProperty(key)) {
          if ("show_title" === key) {
            if (oParams.show_title !== "X") {
              oChart.setTitle({ text : "" }, "", false);
            }
          } else if ("title" === key) {
            oChart.setTitle({ text : oParams.title }, "", false);
          } else if ("show_axis_labels" === key) {
            if (oParams.show_axis_labels !== "X") {
              oChart.xAxis[0].setTitle({ text : "" }, false);
              oChart.yAxis[0].setTitle({ text : "" }, false);
            }
          } else if ("xlabel" === key){
            oChart.xAxis[0].setTitle({ text : oParams.xlabel }, false);
          } else if ("ylabel" === key){
            oChart.yAxis[0].setTitle({ text : oParams.ylabel }, false);
          } else if ("actual_title" === key) {
            oChart.get("idActualSeries").update({ name : oParams.actual_title }, false);
          } else if ("forecast_title" === key) {
            oChart.get("idForecastSeries").update({ name : oParams.forecast_title }, false);
          } else if ("adjustment_title" === key) {
            oChart.get("idAdjustmentSeries").update({ name : oParams.adjustment_title }, false);
          }
        }
      }

      // Now redraw Chart
      oChart.redraw(false /*animation*/ );
    };

    /**
     * Collects and returns all controls in the Chart Settings dialog form.
     * @return {Array} Array of controls
     */
    Forecasts.prototype.getSettingsControls = function () {
      // Getter
      var get = jQuery.proxy(function(sId) {
        return this.getFragmentControl("idChartSettingsFragment", sId);
      }, this);

      return [
        get("idTitleSwitch"),
        get("idTitleInput"),
        get("idAxisLabelsSwitch"),
        get("idXAxisInput"),
        get("idYAxisInput"),
        get("idActualInput"),
        get("idForecastInput"),
        get("idAdjustmentInput")
      ];
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
        this._editNamePopup = sap.ui.xmlfragment("idForecastNameEditFrag", "com.ffa.hpc.view.forecasts.EditForecastNameDialog", this);
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
     *    ██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗ ███████╗
     *    ██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
     *    ███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝███████╗
     *    ██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║
     *    ██║  ██║███████╗███████╗██║     ███████╗██║  ██║███████║
     *    ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝
     *
     */

    /**
     * Gets the control identified by sId from the view.
     * @param  {String} sId The control id
     * @return {Control}     The control
     */
    Forecasts.prototype._getControl = function (sId) {
      return this.getView().byId(sId);
    };

    /**
     * Gets the fragment control identified by sId from the view.
     * @param  {String} sId The control id
     * @return {Control}     The control
     */
    Forecasts.prototype.getFragmentControl = function (sFragmentId, sId) {
      return sap.ui.core.Fragment.byId(sFragmentId, sId);
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
