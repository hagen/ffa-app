jQuery.sap.declare("view.forecasts.Controller");

// Provides controller util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/dash/util/Controller"],
  function(jQuery, UtilController) {
    "use strict";

    var Controller = UtilController.extend("view.forecasts.Controller", /** @lends view.forecasts.Controller */ {
      _aForecasts: [],
      _aBatchOps: []
    });

    /***
     *    ███████╗ ██████╗ ██████╗ ███████╗ ██████╗ █████╗ ███████╗████████╗███████╗
     *    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝
     *    █████╗  ██║   ██║██████╔╝█████╗  ██║     ███████║███████╗   ██║   ███████╗
     *    ██╔══╝  ██║   ██║██╔══██╗██╔══╝  ██║     ██╔══██║╚════██║   ██║   ╚════██║
     *    ██║     ╚██████╔╝██║  ██║███████╗╚██████╗██║  ██║███████║   ██║   ███████║
     *    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝
     *
     */
    
    /**
     * Queries OData backend for forecasts matching filter criteria.
     * @param  {Array} aFilters Array of fitlers
     * @return {boolean}          Result
     */
    Controller.prototype.hasForecasts = function(aFilters) {

      // Query OData for any forecasts matching the supplied filters
      var bForecasts = false;
      this.getView().getModel("forecast").read("/Forecasts", {
        filters: aFilters,
        success: function(oData, mResponse) {
          if (oData.results.length > 0) {
            bForecasts = true;
          }
        },
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false
      });

      // return result
      return bForecasts;
    };

    /**
     * Reads in the forecast; if cached on the client, it is reused,
     * otherwise the cache is refreshed with a read from oData.
     * @param  {string} 	sId				Forecast ID
     * @param  {boolean} 	bRefresh 	Force refresh
     * @return {object}			  			Forecast object
     */
    Controller.prototype.getForecast = function(sId, bRefresh) {
      // Do the read and return
      var oForecast = this._aForecasts[sId];

      // if I already have this forecast, return it.
      if (oForecast && !bRefresh) {
        return oForecast;
      }

      // Otherwise read in the forecast.
      this.getView().getModel("forecast").read("/Forecasts('" + sId + "')", {
        success: function(oData, mResponse) {
          oForecast = oData;
        },
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false
      });

      return oForecast;
    };

    /***
     *    ███████╗ ██████╗ ██╗     ██████╗ ███████╗██████╗ ███████╗
     *    ██╔════╝██╔═══██╗██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
     *    █████╗  ██║   ██║██║     ██║  ██║█████╗  ██████╔╝███████╗
     *    ██╔══╝  ██║   ██║██║     ██║  ██║██╔══╝  ██╔══██╗╚════██║
     *    ██║     ╚██████╔╝███████╗██████╔╝███████╗██║  ██║███████║
     *    ╚═╝      ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝
     *
     */

    /**
     * Get the folder details.
     * @param  {string}  The folder id
     * @return {object/boolean} Folder object
     */
    Controller.prototype.getFolder = function(sId) {
      var oModel = this.getView().getModel("forecast");
      var sPath = "/Folders('" + sId + "')";

      // Is this folder in the model?
      var oFolder = oModel.getProperty(sPath);
      if (!oFolder) {
        this.getView().getModel("forecast").read(sPath, {
          success: function(oData, mResponse) {
            if (oData.id.length > 0) {
              oFolder = oData;
              // and we may as well make sure the folder object is now in the model
              oModel.setProperty(sPath, oFolder);
            }
          },
          error: jQuery.proxy(function(mError) {
            this._maybeHandleAuthError(mError);
          }, this),
          async: false
        });
      }

      // return the folder object :)
      return oFolder;
    };

    /**
     * Get this folder's parent
     * @param  {string}  The folder id
     * @return {object/boolean} Folder parent
     */
    Controller.prototype.getParent = function(sId) {
      var oModel = this.getView().getModel("forecast");
      var sPath = "/Folders('" + sId + "')/Parent";
      var oParent = false;

      // This should be tidied to check if the parent is in the model
      oModel.read(sPath, {
        success: function(oData, mResponse) {
          if (oData.id.length > 0) {
            oParent = oData;
            // and we may as well make sure the folder object is now in the model
            oModel.setProperty("/Folders('" + oParent.id + "')", oParent);
          }
        },
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false
      });

      // if the folder has a parent, return true
      return oParent;
    };

    /**
     * Does this folder have any parents?
     * @param  {string}  The folder id
     * @return {boolean} Has forecasts or not?
     */
    Controller.prototype.hasParent = function(sId) {
      return (this.getParent(sId) === false ? false : true);
    };

    /***
     *    ██████╗  ██████╗  ██████╗██╗   ██╗███╗   ███╗███████╗███╗   ██╗████████╗███████╗
     *    ██╔══██╗██╔═══██╗██╔════╝██║   ██║████╗ ████║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
     *    ██║  ██║██║   ██║██║     ██║   ██║██╔████╔██║█████╗  ██╔██╗ ██║   ██║   ███████╗
     *    ██║  ██║██║   ██║██║     ██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
     *    ██████╔╝╚██████╔╝╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   ███████║
     *    ╚═════╝  ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * [function description]
     * @param  {[type]} aFilters [description]
     * @return {[type]}          [description]
     */
    Controller.prototype.hasDocuments = function(aFilters) {
      // Query OData for any forecasts matching the supplied filters
      var bDocs = false;
      this.getView().getModel("forecast").read("/Documents", {
        filters: aFilters,
        success: function(oData, mResponse) {
          if (oData.results.length > 0) {
            bDocs = true;
          }
        },
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false
      });

      // return result
      return bDocs;
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
     * [function description]
     * @param  {[type]} this._sCacheId [description]
     * @param  {[type]} oModel         [description]
     * @return {[type]}                [description]
     */
    Controller.prototype._getCacheHeader = function(sCacheId, oModel) {
      var oCache = {};
      if (this._oCacheHeader) {
        if (this._oCacheHeader.id === sCacheId) {
          return this._oCacheHeader;
        }
      }

      // otherwise, read.
      oModel.read("/Cache('" + sCacheId + "')", {
        success: jQuery.proxy(function(oData, mResponse) {
          this._oCacheHeader = oData;
        }, this),
        error: jQuery.proxy(function(oData, mResponse) {
          this._oCacheHeader = {};
        }, this),
        async: false
      });

      // return
      return this._oCacheHeader;
    };

    /**
     * For the suuplied Forecast Id, the latest Cache entry (just one) is read.
     * @param  {String} sForecastId Forecast Id
     * @return {String}             Cache Id
     */
    Controller.prototype.getLatestCacheId = function(sForecastId, fnSuccess, fnError) {

      let sCacheId = "";

      // Now set up model read
      this.getView().getModel("forecast").read("/Cache", {
        async: true,
        urlParameters: {
          $top: 1
        },
        filters: [new sap.ui.model.Filter({
          path: 'forecast_id',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: sForecastId
        })],
        sorter: [new sap.ui.model.Sorter({
          path: 'created_at',
          descending: true
        })],
        success: function(oData, mResponse) {
          if (oData.results.length > 0) {
            sCacheId = oData.results[0].id;
          } else {
            sCacheId = "";
          }

          // Call callback
          fnSuccess(sCacheId);
        },
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError();
          // Call callback
          fnError(sCacheId);
        }, this)
      });
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Controller.prototype._getMaxDate = function(sCacheId) {
      let dDate = this._getEndDate(sCacheId);
      return this._date(new Date(dDate.setDate(dDate.getDate() + 1)));
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Controller.prototype._getEndDate = function(sCacheId) {
      var oModel = this.getView().getModel("forecast");
      let dDate = oModel.getProperty("/Cache('" + sCacheId + "')/endda");
      if (!dDate) {
        dDate = this._getCacheHeader(sCacheId, oModel).endda;
      }
      return this._date(dDate);
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Controller.prototype._getBeginDate = function(sCacheId) {
      var oModel = this.getView().getModel("forecast");
      let dDate = oModel.getProperty("/Cache('" + sCacheId + "')/begda");
      if (!dDate) {
        dDate = this._getCacheHeader(sCacheId, oModel).begda;
      }
      return this._date(dDate);
    };
  });
