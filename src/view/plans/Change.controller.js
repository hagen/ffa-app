jQuery.sap.declare("com.ffa.hpc.view.plans.Change");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/view/plans/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Change = Controller.extend("com.ffa.hpc.view.plans.Change", /** @lends com.ffa.hpc.view.plans.Change.prototype */ {
      _oTileTemplate: null,
      _sPlanId: false
    });

    /**
     * On init handler
     */
    Change.prototype.onInit = function() {
      // Handle route matching.
      this.getRouter().getRoute("change-plan").attachPatternMatched(this._onRouteMatched, this);
      this._oTileTemplate = new sap.m.StandardTile({
        icon: "sap-icon://{profile>icon}",
        info: "{profile>info}",
        infoState: "{profile>info_state}",
        type: "{profile>type}",
        number: "{profile>number}",
        numberUnit: "{profile>unit}",
        title: "{profile>title}",
        press: jQuery.proxy(function(oEvent) {
          this.onTilePress(oEvent);
        }, this)
      });
    };

    /**
     * On exit handler
     */
    Change.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Change.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Change.prototype.onAfterRendering = function() {
      jQuery.sap.require("com.ffa.hpc.thirdparty.spiders.Spiders");
    };

    /**
     * When the user is changing their plan, they'll be offered a listing of plans
     * to upgrade/downgrade to, not including Enterprise or their current plan.
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Change.prototype._onRouteMatched = function(oEvent) {

      // Currently busy!
      this.showBusyDialog();

      // set up
      var oModel = this.getView().getModel("profile");
      this._sPlanId = oModel.getProperty("/Profiles('TESTUSER')/plan_type_id") ||
        oModel.getProperty("/CurrentSubscriptions('TESTUSER')/plan_type_id");
      var oPromise = jQuery.Deferred();

      // If undefined, we need to read from Odata
      if (!this._sPlanId) {
        // Read from Odata
        oModel.read("/CurrentSubscriptions('TESTUSER')", {
          success: jQuery.proxy(function(oData, mRepsonse) {
            this._sPlanId = oData.plan_type_id;
            oPromise.resolve();
          }, this),
          error: jQuery.proxy(function(mError) {
            if (mError.response.statusCode = 404) { // Not found
              this._sPlanId = ""; // No plans
              oPromise.resolve();
            } else { // Maybe auth error
              this._maybeHandleAuthError(mError);
            }
          }, this)
        })
      } else {
        // Resolve the promise
        oPromise.resolve();
      }

      // We need to dynamically bind to the Tile Container, and only display
      // those tiles that are not the current plan and not the Enterprise plan
      jQuery.when(oPromise).then(jQuery.proxy(function() {
        var oTileContainer = this.getView().byId("idPlansTileContainer");
        oTileContainer.bindAggregation("tiles", {
          path: 'profile>/PlanTypes',
          sorters: [new sap.ui.model.Sorter({
            path: 'order',
            descending: false
          })],
          filters: [new sap.ui.model.Filter({
            filters: [new sap.ui.model.Filter({
              path: 'id',
              operator: sap.ui.model.FilterOperator.NE,
              value1: this._sPlanId
            }), new sap.ui.model.Filter({
              path: 'id',
              operator: sap.ui.model.FilterOperator.NE,
              value1: 'enterprise'
            })],
            and: true
          })],
          template: this._oTileTemplate
        });

        // Not busy any more
        this.hideBusyDialog();
      }, this));
    };

    /**
     * Navigation back to the accounts page
     * @param  {event} oEvent Button press event
     */
    Change.prototype.onNavBack = function(oEvent) {
      this.getRouter().navTo("account", {}, !sap.ui.Device.system.phone);
    };
    /***
     *    ████████╗██╗██╗     ███████╗    ███████╗██╗   ██╗███████╗███╗   ██╗████████╗███████╗
     *    ╚══██╔══╝██║██║     ██╔════╝    ██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
     *       ██║   ██║██║     █████╗      █████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
     *       ██║   ██║██║     ██╔══╝      ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ╚════██║
     *       ██║   ██║███████╗███████╗    ███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║   ███████║
     *       ╚═╝   ╚═╝╚══════╝╚══════╝    ╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Handles tile press for any one of the available plans.
     * @param  {object} oEvent Tile press event object
     */
    Change.prototype.onTilePress = function(oEvent) {

      // what's the bound index?
      var oTile = oEvent.getSource();
      var oContext = oTile.getBindingContext("profile");

      // Bind dialog to correct plan
      var oDialog = this.getView().byId("idPlanDetailsDialog");
      oDialog.bindElement("profile>/PlanTypes('" + oContext.getProperty("id") + "')");

      // now show the dialog
      oDialog.open();
    };

    /***
     *    ██████╗ ██╗ █████╗ ██╗      ██████╗  ██████╗
     *    ██╔══██╗██║██╔══██╗██║     ██╔═══██╗██╔════╝
     *    ██║  ██║██║███████║██║     ██║   ██║██║  ███╗
     *    ██║  ██║██║██╔══██║██║     ██║   ██║██║   ██║
     *    ██████╔╝██║██║  ██║███████╗╚██████╔╝╚██████╔╝
     *    ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝
     *
     */

    /**
     * Dialog close button press
     * @param  {object} oEvent Button press event
     */
    Change.prototype.onClosePress = function(oEvent) {
      this.getView().byId("idPlanDetailsDialog").close();
    };

    /**
     * Currently navigates to dash
     * @param  {object} oEvent Button press event
     */
    Change.prototype.onGoPress = function(oEvent) {
      // What's our new plan?
      var sPlanId = oEvent.getSource().data("planType");
      this._handlePlanChange(this._sPlanId, /* old */ sPlanId /* new */ );
    };

    /***
     *    ██████╗ ██╗      █████╗ ███╗   ██╗     ██████╗██╗  ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗
     *    ██╔══██╗██║     ██╔══██╗████╗  ██║    ██╔════╝██║  ██║██╔══██╗████╗  ██║██╔════╝ ██╔════╝
     *    ██████╔╝██║     ███████║██╔██╗ ██║    ██║     ███████║███████║██╔██╗ ██║██║  ███╗█████╗
     *    ██╔═══╝ ██║     ██╔══██║██║╚██╗██║    ██║     ██╔══██║██╔══██║██║╚██╗██║██║   ██║██╔══╝
     *    ██║     ███████╗██║  ██║██║ ╚████║    ╚██████╗██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗
     *    ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝     ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
     *
     */

    /**
     * Given the old and new plans, this function updates the user's plan, and
     * updates their billing details. So, what needs to be done. Well, we firstly
     * let's check their usage - if they are over the limits afforded, upgrade
     * /downgrade is not allowed. Once this is approved, we can continue.
     * try to update their billing details in Braintree. Call Node to do this. Once
     * done, we then try and update their details in HANA. Once both of these items,
     * are completed, we're finished.
     * @param  {[type]} sOld [description]
     * @param  {[type]} sNew [description]
     * @return {[type]}      [description]
     */
    Change.prototype._handlePlanChange = function(sOld, sNew) {

      // Firtly, if there's no old plan, then nav straight to the new plan
      // rego page. Don't bother with this bollocks.
      if ("" === sOld || undefined === sOld) {
        this.getRouter().navTo("change-plan-" + sNew);
        return;
      }

      // So busy right now
      this.showBusyDialog();

      // Declare a holder for our error message, if any
      var sMessage = "";

      // Check usage limits
      var sAction = ((sNew === 'pro' || (sNew === 'lite' && (sOld === 'free' || sOld === ""))) ? 'upgrading' : 'downgrading');
      var sProfileId = this.getProfileId();
      var oPlan = this._getPlan(sNew);

      // Check forecasts
      var iCount = this._getActiveForecastCount(sProfileId);
      if (iCount > oPlan.forecast_limit) {
        sMessage = "Unfortunately, you currently have " + iCount + " active forecasts. The new plan only allows " + iLimit + ". Please remove " + (iCount - iLimit) + " before " + sAction + ". ";
      }

      // Now for data.
      var iTotal = this._getDataTotal(sProfileId);
      if (iTotal > oPlan.data_limit) {
        sMessage += "Your training data total sits at " + iTotal + "Mb, while your new plan only allows " + iMax + "Mb. Please remove enough data sets to reduce your total before " + sAction + ".";
      }

      // Do we need to show the error message
      if ("" !== sMessage) {
        // Not busy any more.
        this.hideBusyDialog();

        // Show the error popup
        this.showErrorAlert(
          "Plan change not possible",
          sMessage,
          sap.ui.Device.system.phone
        );
        return;
      }

      // Now we do the updates. Update payments will try and move the user on to the new subscription.
      // Of course, this behaviour will change depending on the down/upgrade
      // path.
      this._updatePayments(sOld, sNew);

      // Not busy any more
      this.hideBusyDialog();
    };

    /***
     *    ██████╗ ██╗      █████╗ ███╗   ██╗
     *    ██╔══██╗██║     ██╔══██╗████╗  ██║
     *    ██████╔╝██║     ███████║██╔██╗ ██║
     *    ██╔═══╝ ██║     ██╔══██║██║╚██╗██║
     *    ██║     ███████╗██║  ██║██║ ╚████║
     *    ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
     *
     */

    /**
     * Reads the plan limit for this particular plan. Now, we know that This
     * value is in the profile model, because it was used to popualte the tiles.
     * So reuse it
     * @param  {[type]} sPlanId [description]
     * @return {[type]}         [description]
     */
    Change.prototype._getPlan = function(sPlanId) {
      var oModel = this.getView().getModel("profile");
      var sPath = "/PlanTypes('" + sPlanId + "')";
      var oPlan = oModel.getObject(sPath);

      // If there's nothing in the model, read from Odata.
      if (oPlan.forecast_limit === undefined || oPlan.data_limit === undefined) {
        oModel.read(sPath, {
          async: false,
          urlParameters: {
            $select: 'forecast_limit,data_limit'
          },
          success: jQuery.proxy(function(oData, mResponse) {
            oPlan = oData;
          }, this),
          error: jQuery.proxy(function(mError) {
            this._maybeHandleAuthError(mError);
            oPlan = undefined;
          }, this)
        });
      }

      return oPlan;
    };

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
     * Given the profile id to check, the new plan and the old plan, This
     * function will determine if the forecast count is okay; because forecasts
     * are allocated on a monthly basis,
     * @param  {[type]} sProfileId [description]
     * @return {[type]}            [description]
     */
    Change.prototype._getActiveForecastCount = function(sProfileId) {

      // Collect the subscription start date
      var dStart = this._getSubscriptionStartDate(sProfileId);

      // Read the number of forecasts that were created between
      // the start date, and now.
      return this._getForecastCount(
        sProfileId,
        dStart,
        true, /* include begin date */
        new Date(Date.now()),
        true /* include end date*/
      );
    };

    /**
     * Read the user's current subscription start date
     * @param  {[type]} sProfileId [description]
     * @return {[type]}            [description]
     */
    Change.prototype._getSubscriptionStartDate = function(sProfileId) {
      // body...
      var oModel = this.getView().getModel("profile");
      var dStart = new Date(0);

      // Well, let's get their subscription start date.
      oModel.read("/Subscriptions", {
        urlParameters: {
          $top: 1
        },
        filters: [new sap.ui.model.Filter({
          path: 'profile_id',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: 'TESTUSER'
        })],
        sorters: [new sap.ui.model.Sorter({
          path: 'endda',
          descending: true
        })],
        success: jQuery.proxy(function(oData, mResponse) {
          // retain the subscription start date
          if (oData.begda) {
            dStart = oData.begda;
          } else { // look in results array
            if (oData.results.length > 0) {
              dStart = oData.results[0].begda;
            } else {
              // For those on free plans, or enterprise,
              dStart = new Date(0);
            }
          }
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
      });

      return dStart;
    };

    /**
     * Read the number of forecasts belonging to this user between the supplied
     * dates
     * @param  {[type]} sProfileId [description]
     * @param  {[type]} dStart     [description]
     * @param  {[type]} bIncStart  [description]
     * @param  {[type]} dEnd       [description]
     * @param  {[type]} bIncEnd    [description]
     * @return {[type]}            [description]
     */
    Change.prototype._getForecastCount = function(sProfileId, dStart, bIncStart, dEnd, bIncEnd) {

      // Set up the begda and endda.
      var dBegda = (bIncStart ? dStart : new Date(dStart.setDate(dStart.getDate() + 1)));
      var dEndda = (bIncEnd ? dEnd : new Date(dEnd.setDate(dEnd.getDate() - 1)));

      // now read the number of forecasts in between, that are currently active
      var oModel = this.getView().getModel("forecast");
      var iCount = 0;

      // Well, let's get their subscription start date.
      oModel.read("/Forecasts", {
        async: false,
        filters: [new sap.ui.model.Filter({
          path: 'user',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: 'TESTUSER'
        }), new sap.ui.model.Filter({
          path: 'endda',
          operator: sap.ui.model.FilterOperator.GE,
          value1: new Date(Date.now())
        }), new sap.ui.model.Filter({
          path: 'begda',
          operator: sap.ui.model.FilterOperator.BT,
          value1: dBegda,
          value2: dEndda
        })],
        success: jQuery.proxy(function(oData, mResponse) {
          // retain the count
          iCount = oData.results.length;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
      });

      // Return the count
      return iCount;
    };

    /***
     *    ██████╗  █████╗ ████████╗ █████╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗
     *    ██║  ██║███████║   ██║   ███████║
     *    ██║  ██║██╔══██║   ██║   ██╔══██║
     *    ██████╔╝██║  ██║   ██║   ██║  ██║
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
     *
     */

    /**
     * Collect the total amount of data this person is using. This is a measure
     * of all cached data belonging to active (endda = 31.12.9999) forecasts
     * @param  {[type]} sProfileId [description]
     * @return {[type]}            [description]
     */
    Change.prototype._getDataTotal = function(sProfileId) {

      // now read the number of forecasts in between, that are currently active
      var oModel = this.getView().getModel("forecast");
      var iTotal = 0;

      // Well, let's get their subscription start date.
      oModel.read("/CacheTotal('TESTUSER')", {
        async: false,
        urlParameters: {
          $select: 'mb'
        },
        success: jQuery.proxy(function(oData, mResponse) {
          // retain the total
          iTotal = oData.mb;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
          iTotal = 0;
        }, this),
      });

      // Return the total
      return iTotal;
    };

    /***
     *    ██████╗  █████╗ ██╗   ██╗███╗   ███╗███████╗███╗   ██╗████████╗███████╗
     *    ██╔══██╗██╔══██╗╚██╗ ██╔╝████╗ ████║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
     *    ██████╔╝███████║ ╚████╔╝ ██╔████╔██║█████╗  ██╔██╗ ██║   ██║   ███████╗
     *    ██╔═══╝ ██╔══██║  ╚██╔╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
     *    ██║     ██║  ██║   ██║   ██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   ███████║
     *    ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Makes a decision about what down/upgrade is taking place, then calls Node
     * to perform the Braintree update.
     * @param  {[type]} sOldPlan [description]
     * @param  {[type]} sNewPlan [description]
     * @return {[type]}          [description]
     */
    Change.prototype._updatePayments = function(sOldPlan, sNewPlan) {

      // Collect the model
      var oModel = this.getView().getModel("profile");
      var sPath = "/Profiles('TESTUSER')/CurrentSubscription";
      var bHasNoPlan = false;

      // We will need to collect the user's current subscription.
      var oSubscription = this.getCurrentSubscription(); // Controller function

      // If the current subscription has no Braintree ID, then we need a totally new
      // plan subscription.
      if (!oSubscription) {
        this.getRouter().navTo("change-plan-" + sNewPlan);
        return;
      } else if (!oSubscription.subscription_id) {
        this.getRouter().navTo("change-plan-" + sNewPlan);
        return;
      }

      // Call Node to perform the subscription change; note that subscriptionId
      // may be blank. This means that the user was previously on free plan.
      var sNewSubscriptionId = "";
      jQuery.ajax({
        url: '/payments/upgrade/' + sNewPlan,
        type: 'POST',
        headers: this.getJqueryHeaders(),
        data: {
          subscriptionId: oSubscription.subscription_id
        },
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {
          // Plan has been upgraded, so let's update the profile
          // with the new subscription Id
          sNewSubscriptionId = oData.id; // the new subscription
        }, this),
        error: jQuery.proxy(function(mError) {
          // handle auth error as normal
          this._maybeHandleAuthError(mError);

          // throw an error to get out of here
          throw new Error({
            message: "Couldn't update your subscription details",
            error: mError
          });
        }, this)
      });

      // Now we can update the user's profile to plans listing by inserting
      // a new record. This has the effect of delimiting the old record, and creating
      var oPayload = {
        id: sNewSubscriptionId,
        profile_id: this.getProfileId(),
        plan_type_id: sNewPlan,
        begda: new Date(Date.now()), // Doesn't matter
        endda: new Data(0) // Doesn't matter
      };

      // And create the record
      oModel.create("/Subscriptions", oPaylod, {
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {
          // Huz-zah, the record has been created, and the user is now bumped up
          // to another subscription.
          var i = 0;
        }),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        })
      });
    };

    return Change;

  }, /* bExport= */ true);
