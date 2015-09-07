jQuery.sap.declare("view.plans.Controller");

// Provides controller view.plans.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/dash/util/Controller"],
  function(jQuery, UtilController) {
    "use strict";

    var Controller = UtilController.extend("view.plans.Controller", /** @lends view.plans.Controller */ {

    });

    /**
     * Request client token from Node
     * @return {[type]} [description]
     */
    Controller.prototype._getClientToken = function() {
      // Request client token from Node.
      let clientToken = "";

      jQuery.ajax({
        url: '/payments/token',
        type: 'GET',
        headers: this.getJqueryHeader(),
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {
          clientToken = oData.clientToken
        }, this),
        error: jQuery.proxy(function(mError) {

        }, this)
      });

      return clientToken;
    };

    /**
     * Create the profile to plan link. This will also update the
     * @param  {[type]} oParams [description]
     * @return {[type]}         [description]
     */
    Controller.prototype._createProfilePlanLink = function(sProfileId, sSubscriptionId, sPlanId) {
      // Collect our model
      let oModel = this.getView().getModel("profile");
      let bContinue = false;

      // Add the begda and endda to payload
      let oPayload = {
        id: "", // Blank for now
        subscription_id : sSubscriptionId,
        profile_id: sProfileId,
        plan_type_id: sPlanId,
        begda: new Date(Date.now()),
        endda: new Date(0) // Not important, will be updated to 31.12.9999 in HANA
      };

      // create the link
      oModel.create("/Subscriptions", oPayload, {
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {
          bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          bContinue = false;
        }, this)
      });

      return bContinue;
    };

    /***
     *    ███████╗██╗   ██╗██████╗ ███████╗ ██████╗██████╗ ██╗██████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗
     *    ██╔════╝██║   ██║██╔══██╗██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
     *    ███████╗██║   ██║██████╔╝███████╗██║     ██████╔╝██║██████╔╝   ██║   ██║██║   ██║██╔██╗ ██║███████╗
     *    ╚════██║██║   ██║██╔══██╗╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   ██║██║   ██║██║╚██╗██║╚════██║
     *    ███████║╚██████╔╝██████╔╝███████║╚██████╗██║  ██║██║██║        ██║   ██║╚██████╔╝██║ ╚████║███████║
     *    ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
     *
     */

    /**
     * Get the user's current subscription, if any. Else, return null;
     * @return {[type]} [description]
     */
    Controller.prototype.getCurrentSubscription = function() {
      // Collect the model
      let oModel = this.getView().getModel("profile");
      let sPath = "/Profiles('TESTUSER')/CurrentSubscription";

      // We will need to collect the user's current subscription.
      let oSubscription = oModel.getProperty(sPath);
      if (!oSubscription) {
        oModel.read(sPath, {
          async: false,
          success: jQuery.proxy(function(oData, mRepsonse) {
            // take the subscription id from the profile
            oSubscription = oData;
          }, this),
          error: jQuery.proxy(function(mError) {

            // If the status code is not found, that simply means that the User
            // has no active subscription
            if (mError.response.statusCode === 404) { // Not found
              oSubscription = null;
            } else {
              // Might be an auth error
              this._maybeHandleAuthError(mError);
              oSubscription = null;
            }
          }, this)
        });
      }

      return oSubscription;
    };
  });
