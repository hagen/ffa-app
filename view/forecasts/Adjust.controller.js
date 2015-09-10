jQuery.sap.declare("view.forecasts.Adjust");

// Provides controller forecasts.Adjust
sap.ui.define(["jquery.sap.global", "view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Adjust = Controller.extend("view.forecasts.Adjust", /** @lends view.forecasts.Adjust.prototype */ {
      _sForecastId: "",
      _sRunId: "",
      _sReturnRoute: ""
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
      }, this));

      // Draw the chart that allows mods
      this._maybeDrawViz(true /* bRefresh */ );
    };

    /**
     * Navigate back to the forecast from which we've come. The trick here is to
     * ensure you navigate back to the correct route. We save the route when
     * the route pattern is matched, however, we may need (depending on the route)
     * to also send some parameters back (like folder_id, for example).
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Adjust.prototype.onNavBackPress = function(oEvent) {

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

        let aAdjust = {
          id: "idActualSeries",
          color: "#2589BD",
          data: [],
          name: "Adjustments",
          zIndex: 100
        };

        let aForecast = {
          id: "idForecastSeries",
          color: "#03CEA4",
          data: [],
          name: "Forecast figures",
          zIndex: 50
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
            aAdjust.data.push([date, adjustment]);
          }
        }, this);

        // and render the chart
        this._liquidsChart = new Highcharts.Chart({
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
          series: [aAdjust, aForecast],
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

    return Adjust;

  }, /* bExport= */ true);
