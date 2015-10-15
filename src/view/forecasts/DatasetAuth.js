jQuery.sap.declare("com.ffa.hpc.view.forecasts.DatasetAuth");

// Provides controller com.ffa.hpc.util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var DatasetAuth = Controller.extend("com.ffa.hpc.view.forecasts.DatasetAuth", /** @lends com.ffa.hpc.view.forecasts.DatasetAuth */ {
      _sDataSetId: ""
    });

    /***
     *     █████╗ ██╗   ██╗████████╗██╗  ██╗███████╗███╗   ██╗████████╗██╗ ██████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
     *    ██╔══██╗██║   ██║╚══██╔══╝██║  ██║██╔════╝████╗  ██║╚══██╔══╝██║██╔════╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
     *    ███████║██║   ██║   ██║   ███████║█████╗  ██╔██╗ ██║   ██║   ██║██║     ███████║   ██║   ██║██║   ██║██╔██╗ ██║
     *    ██╔══██║██║   ██║   ██║   ██╔══██║██╔══╝  ██║╚██╗██║   ██║   ██║██║     ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
     *    ██║  ██║╚██████╔╝   ██║   ██║  ██║███████╗██║ ╚████║   ██║   ██║╚██████╗██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
     *    ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    /**
     * For the supplied data set id, check if this data source requires authentication
     * and if it does, if the username and password are already stored. If they are
     * not stored, then we will need to prompt the user for them, and store temporarily.
     * @param {String}   sId      The Data set Id to check
     * @param {Deferred} oPromise Jquery Deferred
     */
    DatasetAuth.prototype.maybeAuthenticateDataset = function(sId, oPromise) {
      // Okay, so get the data set, and check if it needs authentication.
      // By this stage, all Data sets should be in the model.
      var bAuthReqd = false;
      var oModel = this.getView().getModel("dataset");

      // Copy over the datset id locally so that it can be used for the dialog
      // close and test function.
      this._sDataSetId = sId;

      // Initiate by reading in the dataset
      this._getDataset(sId, oModel,

        // Success callback
        jQuery.proxy(function(oDataset) {
          // Does this Dataset Source type require authentication? Get the Data source
          // type and check the authentication flag
          var oReadPromise = jQuery.Deferred();
          jQuery.when(oReadPromise)
            .then(jQuery.proxy(function() {
              if (bAuthReqd) {
                this._maybePromptForAuth(sId, oDataset.type_id, oModel, oPromise);
              } else {
                oPromise.resolve();
              }
            }, this));

          // now if the authentication flag is already in the model, then we
          // can quickly determine if auth is required. If not, then we have to
          // read from DB
          if (oDataset.DataSource.authentication === undefined) {
            // Do a model read...
            oModel.read("/DataSources('" + oDataset.type_id + "')", {
              urlParameters: {
                $select: "authentication"
              },
              async: true,
              success: function(oData, mResponse) {
                bAuthReqd = (oData.authentication === "X");
                oReadPromise.resolve();
              },
              error: function(mError) {

              }
            });
          } else {
            bAuthReqd = (oDataset.DataSource.authentication === "X");
            oReadPromise.resolve();
          }
        }, this),

        // Error callback
        function() {
          alert("Error reading data set");
        }
      );
    };

    /**
     * Checks if the data source type for this data source has authentication details
     * and if not, prompts for them. These are stored temporarily in global vars.
     * @param  {String}   sId         Data set ID
     * @param  {String}   sDatasource Data source type id
     * @param  {Model}    oModel      Data set model
     * @param  {Deferred} oPromise    Deferred promise
     */
    DatasetAuth.prototype._maybePromptForAuth = function(sId, sDatasource, oModel, oPromise) {

      // We're going to need to get Hold of the data source data set details.
      var sTypeId = sDatasource.charAt(0).toUpperCase() + sDatasource.slice(1);
      var sPath = "/" + sTypeId + "('" + sId + "')";

      // first read the model
      var oObject = oModel.getObject(sPath);

      if (!oObject) {
        oModel.read(sPath, {
          urlParameters: {
            $select: "remember"
          },
          async: true,
          success: jQuery.proxy(function(oData, mResponse) {
            // We got the response. if remember is empty, then we'll need to ask
            // for username and password
            if (oData.remember !== "X") {
              // When we leave this wizard, we'll need to clear the username and
              // password, so set up an event handler for this event. Then
              // we can call it anywhere/anytime.
              this.getEventBus().subscribe("Wizard", "ClearAuth", this["_clear" + sTypeId], this);

              // Prompt for authentication - this will also save the details
              // temporarily in DB
              this._promptForAuth(sPath, this["_test" + sTypeId] /* fnTest */ , this["_update" + sTypeId] /* fnUpdate */ , oPromise);
            } else { // Otherwise, just resolve - we're good to read the data set
              oPromise.resolve();
            }
          }, this),
          error: jQuery.proxy(function(mError) {

          }, this)
        });
      }
    };

    /**
     * Prompts the user for authentication details
     * @param  {String}   sPath    Path to the data set
     * @param  {Function} fnTest   Function to test connectivity
     * @param  {Deferred} oPromise Deferred promise to resolve once we have auth details
     */
    DatasetAuth.prototype._promptForAuth = function(sPath, fnTest, fnUpdate, oPromise) {
      var d = this._oAuthDialog;
      if (!d) {
        d = this._oAuthDialog = sap.ui.xmlfragment("idAuthFragment", "com.ffa.hpc.view.forecasts.AuthDialog", this);
        this.getView().addDependent(d);
      }

      // Supply promise, path and test connection function to dialog
      d.data("promise", oPromise);
      d.data("path", sPath);
      d.data("test", fnTest); // ?
      d.data("update", fnUpdate); // ?

      // Not busy - need to get auth details
      this.hideBusyDialog();
      d.open();
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
     * Read a data set from the supplied model, or read from back-end
     * @param  {String}   sId       data set id
     * @param  {Model}    oModel    Data set Model
     * @param  {Function} fnSuccess Success callback
     * @param  {Function} fnError   error callback
     */
    DatasetAuth.prototype._getDataset = function(sId, oModel, fnSuccess, fnError) {
      var sPath = "/DataSets('" + sId + "')";
      var oObject = oModel.getObject(sPath);
      if (oObject) {
        fnSuccess(oObject);
      } else {
        oModel.read(sPath, {
          async: true,
          success: jQuery.proxy(function(oData, mResponse) {
            fnSuccess(oData);
          }, this),
          error: jQuery.proxy(function(mError) {
            fnError(mError);
          }, this)
        });
      }
    };

    /***
     *     █████╗ ██╗   ██╗████████╗██╗  ██╗    ██████╗ ██╗ █████╗ ██╗      ██████╗  ██████╗
     *    ██╔══██╗██║   ██║╚══██╔══╝██║  ██║    ██╔══██╗██║██╔══██╗██║     ██╔═══██╗██╔════╝
     *    ███████║██║   ██║   ██║   ███████║    ██║  ██║██║███████║██║     ██║   ██║██║  ███╗
     *    ██╔══██║██║   ██║   ██║   ██╔══██║    ██║  ██║██║██╔══██║██║     ██║   ██║██║   ██║
     *    ██║  ██║╚██████╔╝   ██║   ██║  ██║    ██████╔╝██║██║  ██║███████╗╚██████╔╝╚██████╔╝
     *    ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝    ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝
     *
     */

    /**
     * Closes and clears the auth login form
     * @param  {Event} oEvent Button press event
     */
    DatasetAuth.prototype.onAuthCancelPress = function(oEvent) {

      // clsoe the auth dialog and clear it's values
      this._oAuthDialog.close();
      var frag = jQuery.proxy(function(sId) {
        return sap.ui.core.Fragment.byId("idAuthFragment", sId);
      }, this);

      // clear username, password and checkbox
      frag("idUsernameInput").setValue("")
        .setValueState(sap.ui.core.ValueState.None)
        .setValueStateText("");
      frag("idPasswordInput").setValue("")
        .setValueState(sap.ui.core.ValueState.None)
        .setValueStateText("");
      frag("idRememberCheckBox").setSelected(false);
    };

    /**
     * Validates auth details, then tries to connect, then saves the password
     * and username against the data set (temporarily)
     * @param  {Event} oEvent Button press event
     */
    DatasetAuth.prototype.onAuthSavePress = function(oEvent) {

      var bValid = true;
      var d = this._oAuthDialog;

      // Easy
      var frag = jQuery.proxy(function(sId) {
        return sap.ui.core.Fragment.byId("idAuthFragment", sId);
      }, this);

      // clear username, password and checkbox
      var oInput = frag("idUsernameInput");
      var sUsername = oInput.getValue();
      if (!sUsername) {
        oInput.setValueState(sap.ui.core.ValueState.Error)
          .setValueStateText("Please supply a username");
        bValid = false;
      } else {
        oInput.setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("");
      }

      oInput = frag("idPasswordInput");
      var sPassword = oInput.getValue();
      if (!sPassword) {
        oInput.setValueState(sap.ui.core.ValueState.Error)
          .setValueStateText("Please supply a password");
        bValid = false;
      } else {
        oInput.setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("");
      }

      // No more processing if not valid
      if (!bValid) {
        return;
      }

      // Busy
      this.showBusyDialog({});

      // Now we try to connect...
      var d = this._oAuthDialog,
        oPromise = d.data("promise"),
        fnTest = d.data("test"),
        fnUpdate = d.data("update");

      // I too am going to listen to the promise. When it's resolved/rejected,
      // I will need to close this dialog.
      jQuery.when(oPromise).then(function() {
        // Close auth dialog
        if (d) {
          d.close();
        }
      });

      // Connection time
      try {
        fnTest({
          id: this._sDataSetId,
          model: this.getView().getModel("dataset"),
          username: sUsername,
          password: sPassword,
          remember: frag("idRememberCheckBox").getSelected(),
          promise: oPromise,
          success: jQuery.proxy(fnUpdate, this),
          error: jQuery.proxy(function() { // Error
            // Not busy - need to get auth details
            this.hideBusyDialog();

            this.showErrorAlert(
              "Couldn't connect to HANA. Your username or password may be wrong...",
              "Error connecting",
              sap.ui.Device.system.phone
            );
          }, this),
        });
      } catch (e) {}
    };

    /***
     *    ██╗  ██╗██████╗ ██████╗
     *    ██║  ██║██╔══██╗██╔══██╗
     *    ███████║██║  ██║██████╔╝
     *    ██╔══██║██║  ██║██╔══██╗
     *    ██║  ██║██████╔╝██████╔╝
     *    ╚═╝  ╚═╝╚═════╝ ╚═════╝
     *
     */

    /**
     * Function to test connectivity to HANA
     * @param  {Object} oParams Named array of config options
     */
    DatasetAuth.prototype._testHdb = function(oParams) {

      this._test(oParams, "hdb");
    };

    /**
     * function to update authentication details against the Data set
     * @param  {Object} oParams Named array of config options
     */
    DatasetAuth.prototype._updateHdb = function(oParams) {

      this._update(oParams, "hdb");
    };

    /**
     * function to clear  authentication details against the Data set
     * @param  {Object} oParams Named array of config options
     */
    DatasetAuth.prototype._clearHdb = function(sChannel, sEvent, oData) {
      this._clear(oData, "hdb");
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
     * Function to test connectivity to Redshift
     * @param  {Object} oParams Named array of config options
     */
    DatasetAuth.prototype._testRedshift = function(oParams) {

      this._test(oParams, "redshift");
    };

    /**
     * function to update authentication details against the Data set
     * @param  {Object} oParams Named array of config options
     */
    DatasetAuth.prototype._updateRedshift = function(oParams) {

      this._update(oParams, "redshift");
    };

    /**
     * function to clear  authentication details against the Data set
     * @param  {Object} oParams Named array of config options
     */
    DatasetAuth.prototype._clearRedshift = function(sChannel, sEvent, oData) {
      this._clear(oData, "redshift");
    };

    /***
     *     █████╗ ██╗     ██╗         ██████╗ ██████╗
     *    ██╔══██╗██║     ██║         ██╔══██╗██╔══██╗
     *    ███████║██║     ██║         ██║  ██║██████╔╝
     *    ██╔══██║██║     ██║         ██║  ██║██╔══██╗
     *    ██║  ██║███████╗███████╗    ██████╔╝██████╔╝
     *    ╚═╝  ╚═╝╚══════╝╚══════╝    ╚═════╝ ╚═════╝
     *
     */
    /**
     * Function to test connectivity to HANA
     * @param  {Object} oParams     Named array of config options
     * @param  {String} sDataSource Inflected data source type
     */
    DatasetAuth.prototype._test = function(oParams, sDataSource) {

      // Inflect data source
      var s = sDataSource.charAt(0).toUpperCase() + sDataSource.slice(1);

      // update the username and password
      var oPayload = {
        username: oParams.username,
        password: oParams.password,
      };

      // Test HANA; success call back if connection could be made
      oParams.model.update("/" + s + "Test('" + oParams.id + "')", oPayload, {
        async: true,
        merge: true,
        success: jQuery.proxy(function(oData, mResponse) {
          oParams["success"].apply(this, [oParams]);
        }, this),
        error: jQuery.proxy(function(mError) {
          oParams["error"]();
        }, this)
      });
    };

    /**
     * function to update authentication details against the Data set
     * @param  {Object} oParams Named array of config options
     * @param  {String} sDataSource Inflected data source type
     */
    DatasetAuth.prototype._update = function(oParams, sDataSource) {

      // Inflect data source
      var s = sDataSource.charAt(0).toUpperCase() + sDataSource.slice(1);

      // update the username and password
      var oPayload = {
        username: oParams.username,
        password: oParams.password,
        remember: (oParams.remember ? "X" : "")
      };

      // Test HANA; success call back if connection could be made
      oParams.model.update("/" + s + "('" + oParams.id + "')", oPayload, {
        async: true,
        merge: true,
        success: jQuery.proxy(function(oData, mResponse) {
          // Finally, we get to resolve the promise.
          oParams.promise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {
          // Finally, we get to resolve the promise.
          oParams.promise.reject();
        }, this)
      });
    };

    /**
     * function to clear authentication details against the Data set
     * @param  {Object} oData       Named array of config options
     * @param  {String} sDataSource Data source type
     */
    DatasetAuth.prototype._clear = function(oData, sDataSource) {

      // Inflect data source
      var s = sDataSource.charAt(0).toUpperCase() + sDataSource.slice(1);

      // Grab the data set Model
      var oModel = this.getView().getModel("dataset");

      // Does this Dataset want it's auth details cleared?
      var sPath = "/" + s + "('" + oData.dataset_id + "')",
        sRemember = oModel.getProperty(sPath + "/remember"),
        oPromise = jQuery.Deferred();

      // When we have decided what to do with the remember auth details,
      // the promise is resolved
      jQuery.when(oPromise)
        .done(function() {
          // Update if we're not supposed to remember
          if (sRemember !== "X") {
            // Otherwise, clear...
            var oPayload = {
              username: "",
              password: "",
              remember: ""
            };

            // Clear
            oModel.update(sPath, oPayload, {
              async: true,
              merge: true,
              success: jQuery.proxy(function(oData, mResponse) {}, this),
              error: jQuery.proxy(function(mError) {}, this)
            });
          }
        });

      // If this value wasn't in the model, read from DB
      if (sRemember === undefined) {
        oModel.read(sPath, {
          urlParameters: {
            $select: "remember"
          },
          async: true,
          success: jQuery.proxy(function(oData, mResponse) {
            sRemember = oData.remember;
            oPromise.resolve();
          }, this),
          error: jQuery.proxy(function(mError) {

          }, this)
        });
      } else {
        oPromise.resolve();
      }
    };
  });
