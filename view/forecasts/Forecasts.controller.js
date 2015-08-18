jQuery.sap.declare("view.forecasts.Forecasts");

// Provides controller forecasts.Forecasts
sap.ui.define(["jquery.sap.global", "com/ffa/dash/view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Forecasts = Controller.extend("view.forecasts.Forecasts", /** @lends view.forecasts.Forecasts.prototype */ {

    });

    /**
     * On init handler
     */
    Forecasts.prototype.onInit = function() {
      // Our forecast and folder globals
      this._sForecastId = "";
      this._sFolderId = "";
      this._sRunId = "";
      this._sReturnRoute = "";
      this._sTab = "";
      this._navByButton = false;

      // Some promises...
      this._oRunsLoadedPromise = jQuery.Deferred();

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
          this._oRunsLoadedPromise.resolve();
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
      var oParameters = oEvent.getParameters();
      this._sForecastId = oParameters.arguments.forecast_id;
      this._sRoute = oParameters.name;

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
        let iFrom = oCarousel.indexOfPage(this.getView().byId(oCarousel.getActivePage().split("--")[1]));
        let iTo = oCarousel.indexOfPage(oNewPage);
        let i = (iTo - iFrom);

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
        !this["setup" + sInflectedTab + "Page"].apply(this, [])
      } catch (e) {
        // Couldn't call the tab's setup function
        alert(e.message);
      }
    };

    /***
     *    ██████╗  █████╗  ██████╗ ███████╗    ███████╗███████╗████████╗██╗   ██╗██████╗
     *    ██╔══██╗██╔══██╗██╔════╝ ██╔════╝    ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
     *    ██████╔╝███████║██║  ███╗█████╗      ███████╗█████╗     ██║   ██║   ██║██████╔╝
     *    ██╔═══╝ ██╔══██║██║   ██║██╔══╝      ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
     *    ██║     ██║  ██║╚██████╔╝███████╗    ███████║███████╗   ██║   ╚██████╔╝██║
     *    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
     *
     */

    /**
     * Set up the data set page (if necessary)
     * @return {[type]} [description]
     */
    Forecasts.prototype.setupDatasetPage = function() {

    };

    /**
     * Set up the forecast overview page (if necessary)
     * @return {[type]} [description]
     */
    Forecasts.prototype.setupOverviewPage = function() {

    };

    /**
     * Set up the forecast viz page (if necessary); For viz, we need to Bind
     * the chart control to the forecast data set for the latest run,
     * and the forecast Id. In this way, we'll get a listing of the data.
     * @return {[type]} [description]
     */
    Forecasts.prototype.setupVizPage = function() {
      // Before viz loads, collect all necessary data
      var oChart = this.getView().byId("idVizChartJs");
      if (oChart.getDatasets().length > 0) {
        return;
      }

      // otherwise, set up the viz
      oChart.setModel(this.getView().getModel("forecast"));

      // Bind labels (this is the x axis)
      jQuery.when(this._oRunsLoadedPromise).then(jQuery.proxy(function() {
        oChart.bindLabels({
          path: "forecast>/ForecastData",
          parameters: {
            select: "date"
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
          template: new thirdparty.chartjs.Label({
            text: {
              path: "forecast>date",
              type: "sap.ui.model.type.Date",
              formatOptions: {
                pattern: "dd/MM/yyyy"
              }
            }
          })
        });

        // Once the call returns, update the visualisation
        oChart.addDataset(new thirdparty.chartjs.Dataset({
          label: "Date",
          value: "value",
          fillColor: "rgba(144,203,159,0.2)",
          strokeColor: "rgba(144,203,159,1)",
          pointColor: "rgba(144,203,159,1)",
          pointHighlightStroke: "rgba(144,203,159,1)",
          data: {
            path: "forecast>/ForecastData",
            filters: [new sap.ui.model.Filter({
              path: "run_id",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: this._sRunId
            })],
            sorter: [new sap.ui.model.Sorter({
              path: "date",
              descending: false
            })]
          }
        }));
      }, this));

      // Make sure we read in the run id
      this._maybeGetLatestRun(this._oRunsLoadedPromise);
    };

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

      // Make sure we read in the run id
      this._maybeGetLatestRun(this._oRunsLoadedPromise);
    };

    /**
     * Tries to load the latest run id, if not already loaded; once loaded, The
     * promise is resloved.
     * @param  {[type]} oPromise [description]
     */
    Forecasts.prototype._maybeGetLatestRun = function(oPromise) {
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
      if(oModel.hasPendingChanges()) {
        oModel.submitChanges();
      }
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
     * When the run list item is pressed, we show a pop up with information
     * about the run
     * @param  {object} oEvent List item press event
     */
    Forecasts.prototype.onRunListItemPress = function(oEvent) {
      alert("Show run diagnostics");
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

    return Forecasts;

  }, /* bExport= */ true);
