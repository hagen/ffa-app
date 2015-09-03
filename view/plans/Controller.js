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
  Controller.prototype._getClientToken = function () {
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
  Controller.prototype._createProfilePlanLink = function (sProfileId, sPlanId) {
    // Collect our model
    let oModel = this.getView().getModel("settings");
    let bContinue = false;

    // Add the begda and endda to payload
    let oPayload = {
      id : "", // Blank for now
      profile_id : sProfileId,
      plan_type_id : sPlanId,
      begda : new Date(Date.now()),
      endda : new Date(0) // Not important, will be updated to 31.12.9999 in HANA
    };

    // create the link
    oModel.create("/ProfilePlans", oPayload, {
      async : false,
      success : jQuery.proxy(function(oData, mResponse) {
        bContinue = true;
      }, this),
      error : jQuery.proxy(function(mError) {
        bContinue = false;
      }, this)
    });

    return bContinue;
  };
});
