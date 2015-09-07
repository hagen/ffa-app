jQuery.sap.declare("view.settings.Account");
jQuery.sap.require("util.DateFormatter");
jQuery.sap.require("util.Collection");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "com/ffa/dash/util/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Account = Controller.extend("view.settings.Account", /** @lends view.settings.Account.prototype */ {

    });

    /**
     *
     */
    Account.prototype.onInit = function() {
      // handle route matched
      this.getRouter().getRoute("account").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Account.prototype.onExit = function() {};

    /**
     *
     */
    Account.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Account.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Account.prototype._onRouteMatched = function(oEvent) {

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("Account", "RouteMatched", {} /* payload */ );

      // Bind this page to the Social Id...
      let oPage = this.getView().byId("idAccountPage");
      oPage.bindElement("profile>/Profiles('TESTUSER')", {
        expand : 'CacheTotal,ForecastCount',
        select : 'CacheTotal/mb,ForecastCount/count'
      });
    };

    /***
     *    ██████╗ ██╗      █████╗ ███╗   ██╗███████╗
     *    ██╔══██╗██║     ██╔══██╗████╗  ██║██╔════╝
     *    ██████╔╝██║     ███████║██╔██╗ ██║███████╗
     *    ██╔═══╝ ██║     ██╔══██║██║╚██╗██║╚════██║
     *    ██║     ███████╗██║  ██║██║ ╚████║███████║
     *    ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝
     *
     */

    /**
     * User clicked the change plan button. Allow them to select a new plan,
     * for immediate subscription change. User can downgrade, or upgrade. If they
     * are Enterprise user, they cannot change this. If they are not Enterprise user,
     * they cannot select Enterprise
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Account.prototype.onChangePlanPress = function (oEvent) {
      // If Enterprise, no changes are allowed
      let oModel = this.getView().getModel("profile");

      // Show prompt to get user action
      let sMessage = "Please note, if your current plan is non-free, your new subscription price (if any) will take effect immediately. All prices are pro-rated to the day. Continue and change your plan?";
      jQuery.sap.require("sap.m.MessageBox");
      sap.m.MessageBox.show(sMessage, {
        icon: sap.m.MessageBox.Icon.INFORMATION,
        title: "Change plan",
        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
        defaultAction: sap.m.MessageBox.Action.NO,
        initialFocus: sap.m.MessageBox.Action.NO,
        styleClass: (this.getView().getModel("device").getProperty("/isPhone") ? "sapUiSizeCompact" : ""),
        onClose: jQuery.proxy(function(oAction) {
          if (oAction === sap.m.MessageBox.Action.YES) {
            // Otherwise, pull up the plan change screen
            this.getRouter().navTo("change-plan", {}, !sap.ui.Device.system.phone);
          }
        }, this)
      });
    };

    /**
     * True/false is this an enterprise plan
     * @param  {[type]}  oModel [description]
     * @return {Boolean}        [description]
     */
    Account.prototype._isEnterprise = function (oModel) {
      if(!oModel) {
        oModel = this.getView().getModel("profile");
      }

      // Try to determine the Current profile plan type
      let sPlan = oModel.getProperty("/CurrentProfilePlan('TESTUSER')/plan_type_id");
      if (sPlan === undefined) {
        oModel.read("/CurrentProfilePlan('TESTUSER')", {
          async : false,
          success : jQuery.proxy(function(oData, mResponse) {
            sPlan = oData.plan_type_id;
          }, this),
          error : jQuery.proxy(function(mError) {
            this._maybeHandleAuthError(mError);
            sPlan = "";
          }, this)
        });
      }

      // Now return our result
      return sPlan === 'enterprise';
    };

    /***
     *    ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ████████╗███████╗
     *    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗╚══██╔══╝██╔════╝
     *       ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║   ██║   █████╗
     *       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║   ██║   ██╔══╝
     *       ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║   ██║   ███████╗
     *       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
     *
     */

     /**
      * User wishes to terminate their account completely. This will cancel
      * their account and billing. If there has been any activity during the month
      * the user will be charged a pro-rated amount, as it appears they are trying
      * to get some services for free.
      * @param  {[type]} oEvent [description]
      * @return {[type]}        [description]
      */
    Account.prototype.onTerminatePress = function (oEvent) {
      // body...
    };
    
    return Account;

  }, /* bExport= */ true);
