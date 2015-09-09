jQuery.sap.declare("view.forecasts.Adjust");

// Provides controller forecasts.Forecasts
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

    /**
     *
     */
    Adjust.prototype.onExit = function() {};

    /**
     * Before rendering, we will attempt to identify the most recent Run ID.
     * this is kinda important, because without the Forecast and Run Id, we cannot
     * identify the forecast data set
     */
    Adjust.prototype.onBeforeRendering = function() {};

    /**
     *
     */
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
        expand : "Forecast"
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
      this._drawViz(true /* bRefresh */ );
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
        oParams.folder_id = this.getView().getModel("forecast").getProperty("/Forecasts('" + this._sForecastId + "')/folder_id");
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
     * Draw the chart visualisation, with the original forecasts values,
     * and the adjusted forecast values.
     * @param  {boolean} bRefresh Redraw entire chart
     */
    Adjust.prototype._drawViz = function(bRefresh) {
      // Draw chart viz
      // 
    };

    return Adjust;

  }, /* bExport= */ true);
