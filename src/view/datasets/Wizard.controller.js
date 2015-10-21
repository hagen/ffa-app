jQuery.sap.declare("com.ffa.hpc.view.datasets.Wizard");
// Require the short Id gen library
jQuery.sap.require("com.ffa.hpc.thirdparty.shortid.ShortId");
jQuery.sap.require("com.ffa.hpc.thirdparty.momentjs.Momentjs");

// Provides controller view.Wizard
sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/view/datasets/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Wizard = Controller.extend("com.ffa.hpc.view.datasets.Wizard", /** @lends com.ffa.hpc.view.datasets.Wizard.prototype */ {
      _isAllowedCheckTime : moment(),
      _isAllowed : false
    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    Wizard.prototype.onInit = function() {
      // Subscribe to busy calls
      this.getEventBus().subscribe("Busy", "Show", this.openBusyDialog, this);
      this.getEventBus().subscribe("Busy", "Update", this.updateBusyDialog, this);
      this.getEventBus().subscribe("Busy", "Close", this.closeBusyDialog, this);

      // handle route matched
      this.getRouter().getRoute("new-dataset").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Wizard.prototype.onExit = function() {};

    /**
     *
     */
    Wizard.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Wizard.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Wizard.prototype._onRouteMatched = function(oEvent) {
      this.checkMetaDataLoaded("dataset");

      // We set up a promise to allow for async checking of allowances
      var oPromise = jQuery.Deferred();
      var oRouter = this.getRouter();
      var oNav = this.getView().byId("idNavContainer");
      var self = this;

      jQuery.when(oPromise).fail(function() { // rejected - go to sad face
        oNav.to(self.getView().byId("idMessagePage"));
      }).done(function() { // resolved - go to new data set page
        oNav.back();
      });

      // First we're going to check if this user has enough data allowance to
      // create a new data set...
      this._isAllowedNew(oPromise);
    };

    /***
     *    ██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗██╗ ██████╗
     *    ██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗
     *    ██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   ██║██║   ██║
     *    ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   ██║██║   ██║
     *    ██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║██╗██║╚██████╔╝
     *    ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝╚═╝╚═╝ ╚═════╝
     *
     */

     /**
      * User is configuring Import IO
      * @param  {object} oEvent Button click event
      */
     Wizard.prototype.onImportIOItemPress = function(oEvent) {
       // Create the fragment and open!
       this.getRouter().navTo("importio", {}, !sap.ui.Device.system.phone);
     };

    /***
     *    ██╗  ██╗ █████╗ ███╗   ██╗ █████╗
     *    ██║  ██║██╔══██╗████╗  ██║██╔══██╗
     *    ███████║███████║██╔██╗ ██║███████║
     *    ██╔══██║██╔══██║██║╚██╗██║██╔══██║
     *    ██║  ██║██║  ██║██║ ╚████║██║  ██║
     *    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
     *
     */
    /**
     * User is configuring HANA cloud option
     * @param  {object} oEvent Button click event
     */
    Wizard.prototype.onHanaItemPress = function(oEvent) {
      // Create the fragment and open!
      this.getRouter().navTo("hdb", {}, !sap.ui.Device.system.phone);
    };

    /***
     *    ██╗  ██╗ █████╗ ██████╗  ██████╗  ██████╗ ██████╗
     *    ██║  ██║██╔══██╗██╔══██╗██╔═══██╗██╔═══██╗██╔══██╗
     *    ███████║███████║██║  ██║██║   ██║██║   ██║██████╔╝
     *    ██╔══██║██╔══██║██║  ██║██║   ██║██║   ██║██╔═══╝
     *    ██║  ██║██║  ██║██████╔╝╚██████╔╝╚██████╔╝██║
     *    ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚═════╝ ╚═╝
     *
     */

    /**
     * User is configuring HDFS
     * @param  {object} oEvent Button click event
     */
    Wizard.prototype.onHadoopItemPress = function(oEvent) {
      // Coming soon.
      this._alertComingSoon();
    };

    /***
     *    ██████╗ ███████╗██████╗ ███████╗██╗  ██╗██╗███████╗████████╗
     *    ██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║██║██╔════╝╚══██╔══╝
     *    ██████╔╝█████╗  ██║  ██║███████╗███████║██║█████╗     ██║
     *    ██╔══██╗██╔══╝  ██║  ██║╚════██║██╔══██║██║██╔══╝     ██║
     *    ██║  ██║███████╗██████╔╝███████║██║  ██║██║██║        ██║
     *    ╚═╝  ╚═╝╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝
     *
     */

    /**
     * User is configuring AWS Redshift
     * @param  {object} oEvent Button click event
     */
    Wizard.prototype.onRedshiftItemPress = function(oEvent) {
      // Create the fragment and open!
      this.getRouter().navTo("redshift", {}, !sap.ui.Device.system.phone);
    };

    /***
     *     ██████╗  ██████╗  ██████╗  ██████╗ ██╗     ███████╗
     *    ██╔════╝ ██╔═══██╗██╔═══██╗██╔════╝ ██║     ██╔════╝
     *    ██║  ███╗██║   ██║██║   ██║██║  ███╗██║     █████╗
     *    ██║   ██║██║   ██║██║   ██║██║   ██║██║     ██╔══╝
     *    ╚██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗
     *     ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
     *
     */
    /**
     * User is configuring Google Sheets option
     * @param  {object} oEvent Button click event
     */
    Wizard.prototype.onSheetsItemPress = function(oEvent) {
      // Create the fragment and open!
      this.getRouter().navTo("sheets", {}, !sap.ui.Device.system.phone);
    };

    /***
     *     ██████╗███████╗██╗   ██╗
     *    ██╔════╝██╔════╝██║   ██║
     *    ██║     ███████╗██║   ██║
     *    ██║     ╚════██║╚██╗ ██╔╝
     *    ╚██████╗███████║ ╚████╔╝
     *     ╚═════╝╚══════╝  ╚═══╝
     *
     */
    /**
     * Handles the tile press for Csv data sources
     * @param  {object} oEvent Button/tile press event
     */
    Wizard.prototype.onCsvItemPress = function(oEvent) {
      this.showInfoAlert(
        "It's great that you want to get cracking with forecasting!"
        + " Rather than uploading static CSV files, please set up a Google Sheets document"
        + " or make use of a cloud platform like Import.IO. Once you've"
        + " uploaded your data there, come on back and set up your data set with the corresponding data source.",
        "Age of the cloud");
    };

    /***
     *    ███████╗██╗  ██╗ ██████╗███████╗██╗
     *    ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██║
     *    █████╗   ╚███╔╝ ██║     █████╗  ██║
     *    ██╔══╝   ██╔██╗ ██║     ██╔══╝  ██║
     *    ███████╗██╔╝ ██╗╚██████╗███████╗███████╗
     *    ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝
     *
     */

    /**
     * Handles the tile press for Csv data sources
     * @param  {object} oEvent Button/tile press event
     */
    Wizard.prototype.onExcelItemPress = function(oEvent) {
      // Coming soon.
      this._alertComingSoon();
    };

    /**
     * Displays an alert with the supplied (optional) message
     * @param  {String} sMessage (optional) Message to display
     */
    Wizard.prototype._alertComingSoon = function(sMessage) {
      // If message is supplied, use it, otherwise, don't bother.
      this.showInfoAlert(sMessage || "Almost there. Sorry, this hasn't been implemented yet.", "Coming soon");
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
     * Determines whether the user is allowed to create any more data sets,
     * in accordance with the allowances of their plan.
     * @param  {Deferred} Promise
     * @return {Boolean}  Allowed?
     */
    Wizard.prototype._isAllowedNew = function(oPromise) {

      // It's cool, don't bother checking again, just resolve and return
      if (this._isAllowed && this._isAllowedCheckTime.diff(moment(), "minutes") < 5) {
        oPromise.resolve();
        return;
      }

      // checks the total amount of data the user has against the total
      // amount their plan allows for. if they're over, then they cannot Create
      // a new data set until they get rid of something.
      this.showBusyDialog({});

      // read in the total amount currently used...
      var oTotalPromise = jQuery.Deferred();
      var fTotal = 0;
      this._readCacheTotalKb(this.getProfileId(), oTotalPromise, function(total) {
        fTotal = total;
      });

      // and plan allowance
      var oLimitPromise = jQuery.Deferred();
      var fLimit = 0;
      this._readPlanLimitKb(this.getProfileId(), oLimitPromise, function(limit) {
        fLimit = limit;
      });

      // When all of our async reads have come back
      var self = this;
      jQuery.when(oTotalPromise).done(function() {
        jQuery.when(oLimitPromise).done(function() {
          // Now compare. If fTotal is greater than fLimit, then no more data sets are allowed.
          if (fTotal >= fLimit) {
            // Hide busy
            self.hideBusyDialog();

            // Alert, you're over!
            self.showInfoAlert(
              "Yikes! You're over your plan's data allowance! You'll have to remove a data set or two, or upgrade your account to create new data sets.",
              "Plan data limit reached",
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
     * Async read of the user's total cache store, and when done, executes a callback
     * and resolves a promise. I use promises so that we don't end up Christmas treeing.
     * @param  {String}   sProfileId  Profile ID
     * @param  {Deferred} oPromise    Deferred promise
     * @param  {Function} fnCallback  Callback function
     */
    Wizard.prototype._readCacheTotalKb = function(sProfileId, oPromise, fnCallback) {
      // Model for reading
      var oModel = this.getView().getModel("forecast");

      // first check if the model has the data we want...
      var sPath = "/CacheTotal('" + sProfileId + "')";
      var oTotal = oModel.getProperty(sPath);
      if (oTotal) {
        // Callback and resolve
        try {
          fnCallback(parseInt(oTotal.kb, 10));
        } catch (e) {}
        oPromise.resolve();
      } else {
        oModel.read(sPath, {
          async: true,
          success: jQuery.proxy(function(oData, mResponse) {
            // Callback and resolve
            try {
              fnCallback(parseInt(oData.kb, 10));
            } catch (e) {}
            oPromise.resolve();
          }, this),
          error: jQuery.proxy(function(mError) {
            // What to do? Note, this could be because the user is NEW and has
            // no data!
            fnCallback(0);
            oPromise.resolve();
          }, this)
        })
      }
    };

    /**
     * Async read of the user's current plan limit. When done, executes a callback
     * and resolves a promise. I use promises so that we don't end up Christmas treeing.
     * @param  {String}   sProfileId  Profile ID
     * @param  {Deferred} oPromise    Deferred promise
     * @param  {Function} fnCallback  Callback function
     */
    Wizard.prototype._readPlanLimitKb = function(sProfileId, oPromise, fnCallback) {
      // Model for reading
      var oModel = this.getView().getModel("profile");

      // first check if the model has the data we want...
      var sPath = "/CurrentSubscriptions('" + sProfileId + "')";
      var oPlan = oModel.getProperty(sPath);
      if (oPlan) {
        // Callback and resolve
        try {
          fnCallback(oPlan.data_limit * 1000);
        } catch (e) {}
        oPromise.resolve();
      } else {
        oModel.read(sPath, {
          async: true,
          success: jQuery.proxy(function(oData, mResponse) {
            // Callback and resolve
            try {
              // data limit is in mb - multiply by 1000 for kb
              fnCallback(oData.data_limit * 1000);
            } catch (e) {}
            oPromise.resolve();
          }, this),
          error: jQuery.proxy(function(mError) {
            // What to do? Note, this could be because the user is NEW and has
            // no forecasts!
            fnCallback(0);
            oPromise.resolve();
          }, this)
        })
      }
    };

    return Wizard;

  }, /* bExport= */ true);
